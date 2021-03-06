import BigNumber from 'bignumber.js';
import { action, computed, observable } from 'mobx';

import backend from '../backend';
import { fromWei } from '../utils';

const REFRESH_DELAY = 4000;

class AuctionStore {
  @observable beginTime = new Date();
  @observable block = {};
  @observable BONUS_DURATION = new BigNumber(0);
  @observable BONUS_SIZE = new BigNumber(0);
  @observable chart = {};
  @observable connected = 'disconnected'
  @observable contractAddress = '0x';
  @observable currentPrice = new BigNumber(0);
  @observable DIVISOR = new BigNumber(1);
  @observable endTime = new Date();
  @observable STATEMENT_HASH = '0x';
  @observable tokensAvailable = new BigNumber(0);
  @observable tokenCap = new BigNumber(0);
  @observable totalAccounted = new BigNumber(0);
  @observable totalReceived = new BigNumber(0);

  USDWEI = new BigNumber(10).pow(18).div(200);

  constructor () {
    this.init()
      .then(() => this.refresh());
  }

  async init () {
    const {
      BONUS_DURATION,
      BONUS_SIZE,
      DIVISOR,
      STATEMENT_HASH,
      beginTime,
      tokenCap
    } = await backend.sale();

    this.BONUS_DURATION = new BigNumber(BONUS_DURATION);
    this.BONUS_SIZE = new BigNumber(BONUS_SIZE);
    this.DIVISOR = new BigNumber(DIVISOR);
    this.STATEMENT_HASH = STATEMENT_HASH;

    this.beginTime = new Date(beginTime);
    this.tokenCap = new BigNumber(tokenCap);
  }

  bonus (value) {
    if (!this.isActive() || !this.inBonus) {
      return new BigNumber(0);
    }

    return value.mul(this.BONUS_SIZE).div(100);
  }

  getPrice (_time) {
    if (!this.isActive()) {
      return new BigNumber(0);
    }

    const time = new BigNumber(Math.round(_time.getTime() / 1000));
    const beginTime = new BigNumber(Math.round(this.beginTime.getTime() / 1000));
    const { DIVISOR, USDWEI } = this;

    return USDWEI
      .mul(new BigNumber(18432000).div(time.sub(beginTime).add(5760)).sub(5))
      .div(DIVISOR)
      .round();
  }

  getTarget (time) {
    const price = this.getPrice(time);

    return price.mul(this.DIVISOR).mul(this.tokenCap);
  }

  getTime (price) {
    const beginTime = new BigNumber(Math.round(this.beginTime.getTime() / 1000));
    const { DIVISOR, USDWEI } = this;

    const f1 = price
      .mul(DIVISOR)
      .div(USDWEI)
      .add(5);

    const time = new BigNumber(18432000)
      .div(f1)
      .sub(5760)
      .add(beginTime)
      .round();

    return new Date(time.mul(1000).toNumber());
  }

  getTimeFromTarget (target) {
    const price = target.div(this.DIVISOR).div(this.tokenCap);

    return this.getTime(price);
  }

  isActive () {
    return this.now >= this.beginTime && this.now < this.endTime;
  }

  theDeal (value) {
    let accepted = new BigNumber(0);
    let refund = new BigNumber(0);

    const bonus = this.bonus(value);
    const price = this.currentPrice;

    if (!this.isActive()) {
      return {
        accepted,
        bonus,
        refund,
        price
      };
    }

    accepted = value.add(bonus);

    let tokens = accepted.div(price);

    if (tokens.gt(this.tokensAvailable)) {
      accepted = this.tokensAvailable.mul(price);
      if (value.gt(accepted)) {
        refund = value.sub(accepted);
      }
    }

    return {
      accepted,
      bonus,
      refund,
      price
    };
  }

  @computed
  get beginPrice () {
    return this.getPrice(this.beginTime);
  }

  @computed
  get endPrice () {
    return this.getPrice(this.endTime);
  }

  @computed
  get inBonus () {
    const bonusEndTime = new Date(this.beginTime.getTime() + this.BONUS_DURATION * 1000);

    return this.now < bonusEndTime;
  }

  @computed
  get maxSpend () {
    return this.currentPrice.mul(this.tokensAvailable);
  }

  @computed
  get now () {
    if (!this.block || !this.block.timestamp) {
      return new Date(0);
    }

    return new Date(this.block.timestamp);
  }

  async refresh () {
    try {
      const { hash } = await backend.blockHash();

      // Same block, no updates
      if (this.block.hash !== hash) {
        const status = await backend.status();

        this.update(status);
      }
    } catch (error) {
      console.error(error);
    }

    setTimeout(() => {
      this.refresh();
    }, REFRESH_DELAY);
  }

  @action
  setChart (chart) {
    this.chart = chart;
  }

  @action
  update (status) {
    const {
      block,
      connected,
      contractAddress,

      currentPrice,
      endTime,
      tokensAvailable,
      totalAccounted,
      totalReceived
    } = status;

    if (block && block.number) {
      block.number = new BigNumber(block.number);
    }

    // Only update the chart when the price updates
    const nextTotalAccounted = new BigNumber(totalAccounted);
    const update = !nextTotalAccounted.eq(this.totalAccounted);

    this.currentPrice = new BigNumber(currentPrice);
    this.endTime = new Date(endTime);
    this.tokensAvailable = new BigNumber(tokensAvailable);
    this.totalAccounted = new BigNumber(totalAccounted);
    this.totalReceived = new BigNumber(totalReceived);

    this.block = block;
    this.connected = connected;
    this.contractAddress = contractAddress;

    if (update || !this.chart.data) {
      this.updateChartData();
    }
  }

  formatChartPrice (price) {
    if (price === undefined) {
      return undefined;
    }

    return this.formatPrice(price).toNumber();
  }

  formatPrice (price) {
    return fromWei(price.mul(this.DIVISOR));
  }

  formatChartData (data) {
    const { target, raised, time } = data;

    return {
      target: fromWei(target).round().toNumber(),
      raised: fromWei(raised).toNumber(),
      time: time.getTime()
    };
  }

  async updateChartData () {
    const { beginTime, now } = this;
    const raisedRawData = await backend.chartData();

    const raisedData = raisedRawData
      .map((datum) => {
        const { time, totalAccounted } = datum;
        const value = new BigNumber(totalAccounted);

        return { value, time: new Date(time) };
      })
      .sort((rA, rB) => rB.time - rA.time);

    const NUM_TICKS = 200;
    const data = [];

    const beginTarget = this.getTarget(beginTime);
    const nowTarget = this.getTarget(now);

    const targetInteval = beginTarget.sub(nowTarget).div(NUM_TICKS);

    for (let i = 0; i <= NUM_TICKS; i++) {
      // The target decreases with time
      const target = beginTarget.sub(targetInteval.mul(i));
      const time = this.getTimeFromTarget(target);
      const raisedIndex = raisedData.findIndex((d) => d.time <= time);
      const raised = raisedIndex === -1
        ? new BigNumber(0)
        : raisedData[raisedIndex].value;

      data.push({ target, time, raised });
    }

    const dateInterval = (now - beginTime) / NUM_TICKS;

    for (let i = 0; i <= NUM_TICKS; i++) {
      const time = new Date(beginTime.getTime() + dateInterval * i);
      const target = this.getTarget(time);
      const raisedIndex = raisedData.findIndex((d) => d.time <= time);
      const raised = raisedIndex === -1
        ? new BigNumber(0)
        : raisedData[raisedIndex].value;

      data.push({ target, time, raised });
    }

    data.push({
      time: new Date(now.getTime() + dateInterval),
      raised: this.totalAccounted,
      target: nowTarget
    });

    const formattedData = data
      .sort((ptA, ptB) => ptA.time - ptB.time)
      .map((datum) => this.formatChartData(datum));

    this.setChart({
      data: formattedData
    });
  }
}

export default new AuctionStore();

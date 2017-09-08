import { action, observable } from 'mobx';
import { phraseToWallet } from '@parity/ethkey.js';
import { randomPhrase } from '@parity/wordlist';

import backend from '../backend';
import blockStore from './block.store';

class FeeStore {
  @observable fee = null;
  @observable wallet = null;

  constructor () {
    this.load();

    blockStore.on('block', () => {
      console.warn('UPDATE');
    });
  }

  async createWallet () {
    const phrase = randomPhrase(12);
    const { address, secret } = await phraseToWallet(phrase);

    return { address, secret, phrase };
  }

  async load () {
    try {
      const fee = await backend.fee();
      const wallet = await this.createWallet();

      this.setFee(fee);
      this.setWallet(wallet);
      this.watch()
    } catch (error) {
      console.error(error);
    }
  }

  @action
  setFee (fee) {
    this.fee = fee;
  }

  @action
  setWallet ({ address, secret, phrase }) {
    this.wallet = { address, secret, phrase };
  }

  watch () {
    const { address } = this.wallet;
  }
}

export default new FeeStore();

import { action, observable } from 'mobx';

import backend from '../backend';

const REFRESH_DELAY = 4000;

class BlockStore {
  @observable hash = '0x0';

  constructor () {
    this.init()
      .then(() => this.refresh());
  }

  async init () {
    const { hash } = await backend.blockHash();

    this.hash = hash;
  }

  async refresh () {
    try {
      const { hash } = await backend.blockHash();

      // Same block, no updates
      if (this.hash !== hash) {
        this.update(hash);
      }
    } catch (error) {
      console.error(error);
    }

    setTimeout(() => {
      this.refresh();
    }, REFRESH_DELAY);
  }

  @action
  update (hash) {
    this.hash = hash;
  }
}

export default new BlockStore();

import { action, observable } from 'mobx';

export const STEPS = {
  'fee': Symbol('fee')
};

class AppStore {
  @observable step = STEPS[Object.keys(STEPS)[0]];

  @action
  goto (name) {
    if (!STEPS[name]) {
      return;
    }

    this.step = STEPS[name];
  }
}

export default new AppStore();

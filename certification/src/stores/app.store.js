import { action, observable } from 'mobx';

export const STEPS = {
  'fee': Symbol('fee'),
  'certify': Symbol('certify')
};

class AppStore {
  @observable step = STEPS['fee'];

  @action
  goto (name) {
    if (!STEPS[name]) {
      throw new Error(`unkown step ${name}`);
    }

    this.step = STEPS[name];
  }
}

export default new AppStore();

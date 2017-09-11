import { action, observable } from 'mobx';

export const STEPS = {
  'fee': Symbol('fee'),
  'certify': Symbol('certify')
};

class AppStore {
  @observable loading = false;
  @observable step = STEPS['fee'];

  @action
  goto (name) {
    if (!STEPS[name]) {
      throw new Error(`unkown step ${name}`);
    }

    this.step = STEPS[name];
  }

  @action setLoading (loading) {
    this.loading = loading;
  }
}

export default new AppStore();

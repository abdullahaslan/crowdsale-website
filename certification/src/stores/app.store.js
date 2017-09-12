import { action, observable } from 'mobx';

export const STEPS = {
  'country-selection': Symbol('country selection'),
  'fee': Symbol('fee'),
  'certify': Symbol('certify'),
  'certified': Symbol('certified')
};

class AppStore {
  @observable loading = false;
  @observable step = STEPS['country-selection'];
  @observable padding = window.location.hash !== '#no-padding';

  loaders = {};

  async goto (name) {
    if (!STEPS[name]) {
      throw new Error(`unkown step ${name}`);
    }

    this.setLoading(true);
    this.setStep(STEPS[name]);

    // Trigger the loaders and wait for them to return
    if (this.loaders[name]) {
      for (let loader of this.loaders[name]) {
        await loader();
      }
    }

    this.setLoading(false);
  }

  register (step, loader) {
    if (!STEPS[step]) {
      throw new Error(`unkown step ${step}`);
    }

    this.loaders[step] = (this.loaders[step] || []).concat(loader);
  }

  @action setLoading (loading) {
    this.loading = loading;
  }

  @action setStep (step) {
    this.step = step;
  }
}

export default new AppStore();

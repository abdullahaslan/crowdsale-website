import { action, observable } from 'mobx';

export const STEPS = {
  'start': Symbol('start'),
  'terms': Symbol('terms'),
  'country-selection': Symbol('country selection'),
  'fee': Symbol('fee'),
  'certify': Symbol('certify'),
  'certified': Symbol('certified')
};

class AppStore {
  @observable loading = false;
  @observable termsAccepted = false;
  @observable step = STEPS['start'];

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

  @action setTermsAccepted (termsAccepted) {
    this.termsAccepted = termsAccepted;
  }

  @action setStep (step) {
    this.step = step;
  }
}

export default new AppStore();

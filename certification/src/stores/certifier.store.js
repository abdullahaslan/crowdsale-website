import { action, observable } from 'mobx';
import Onfido from 'onfido-sdk-ui';

import appStore from './app.store';
import feeStore from './fee.store';
import backend from '../backend';

const CHECK_STATUS_INTERVAL = 2000;

const ONFIDO_STATUS = {
  UNKOWN: 'unkown',
  CREATED: 'created',
  PENDING: 'pending',
  COMPLETED: 'completed'
};

class CertifierStore {
  @observable country = '';
  @observable error = null;
  @observable firstName = '';
  @observable lastName = '';
  @observable loading = false;
  @observable open = false;
  @observable onfido = false;
  @observable pending = false;

  sdkToken = null;

  constructor () {
    appStore.register('certify', this.load);
  }

  load = async () => {
    const { payer } = feeStore;
    const { certified, status } = await backend.checkStatus(payer);

    if (certified) {
      return appStore.goto('certified');
    }

    if (status === ONFIDO_STATUS.PENDING) {
      this.pollCheckStatus();
    }
  };

  async createApplicant () {
    this.setError(null);
    this.setLoading(true);

    const { payer } = feeStore;
    const { country, firstName, lastName } = this;

    try {
      const { sdkToken } = await backend.createApplicant(payer, {
        country,
        firstName,
        lastName
      });

      this.shouldMountOnfido = true;
      this.sdkToken = sdkToken;

      this.setOnfido(true);
    } catch (error) {
      this.setError(error);
    }

    this.setLoading(false);
  }

  async handleOnfidoComplete () {
    const { payer } = feeStore;

    try {
      await backend.createCheck(payer);
      this.pollCheckStatus();
    } catch (error) {
      this.setError(error);
    }
  }

  mountOnfido () {
    if (this.onfidoObject || !this.shouldMountOnfido) {
      return;
    }

    this.shouldMountOnfido = false;
    this.onfidoObject = Onfido.init({
      useModal: false,
      token: this.sdkToken,
      containerId: 'onfido-mount',
      onComplete: () => this.handleOnfidoComplete(),
      steps: [
        'document'
        // 'face'
      ]
    });
  }

  unmountOnfido () {
    if (this.onfidoObject) {
      this.onfidoObject.tearDown();
      delete this.onfidoObject;
    }
  }

  async pollCheckStatus () {
    if (!this.pending) {
      this.setPending(true);
    }

    const { payer } = feeStore;
    const { status, result } = await backend.checkStatus(payer);

    if (status === ONFIDO_STATUS.PENDING) {
      clearTimeout(this.checkStatusTimeoutId);
      this.checkStatusTimeoutId = setTimeout(() => {
        this.pollCheckStatus();
      }, CHECK_STATUS_INTERVAL);
      return;
    }

    if (status === ONFIDO_STATUS.COMPLETED) {
      if (result === 'success') {
        return appStore.goto('certified');
      }

      this.setError(new Error('Something went wrong with your verification. Please try again.'));
    }
  }

  reset (soft = false) {
    this.error = null;
    this.firstName = '';
    this.lastName = '';
    this.loading = false;
    this.onfido = false;

    if (!soft) {
      this.pending = false;
    }
  }

  @action
  setCountry (country) {
    this.country = country;
  }

  @action
  setError (error) {
    if (error) {
      console.error(error);
    }

    this.error = error;
    this.pending = false;
  }

  @action
  setFirstName (firstName) {
    this.firstName = firstName;
  }

  @action
  setLastName (lastName) {
    this.lastName = lastName;
  }

  @action
  setLoading (loading) {
    this.loading = loading;
  }

  @action
  setOnfido (onfido) {
    this.onfido = onfido;
  }

  @action
  setPending (pending) {
    this.pending = pending;
  }
}

export default new CertifierStore();

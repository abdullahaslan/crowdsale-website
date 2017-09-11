import { observer } from 'mobx-react';
import React, { Component } from 'react';
import { Dimmer, Header, Loader, Segment } from 'semantic-ui-react';

import Certifiers from './Certifiers';

import certifierStore from '../stores/certifier.store';

const STEPS = {
  VERIFY_WITH_KRAKEN: Symbol('verify-kraken'),
  VERIFY_WITH_PARITY: Symbol('verify-parity')
};

@observer
export default class Certifier extends Component {
  static initialState = {
    step: STEPS.VERIFY_WITH_PARITY
  };

  state = Certifier.initialState;

  componentWillMount () {
    certifierStore.load();
  }

  componentWillUnmount () {
    this.reset();
  }

  render () {
    const { pending } = certifierStore;

    if (pending) {
      return this.renderPending();
    }

    const { step } = this.state;

    if (step === STEPS.VERIFY_WITH_PARITY) {
      return this.renderVerifyParity();
    }

    if (step === STEPS.VERIFY_WITH_KRAKEN) {
      return this.renderVerifyKraken();
    }

    return null;
  }

  renderPending () {
    return (
      <Segment basic>
        <Dimmer active inverted>
          <Loader>
            <Header>We are currently verifying your identity...</Header>
          </Loader>
        </Dimmer>
      </Segment>
    );
  }

  renderVerifyKraken () {
    return (
      <Certifiers.Kraken />
    );
  }

  renderVerifyParity () {
    return (
      <Certifiers.Parity />
    );
  }

  handleCertify = () => {
    certifierStore.setOpen(true);
  };

  handleVerifyKraken = () => {
    this.setState({ step: STEPS.VERIFY_WITH_KRAKEN });
  };

  handleVerifyParity = () => {
    this.setState({ step: STEPS.VERIFY_WITH_PARITY });
  };

  reset = () => {
    this.setState(Certifier.initialState, () => {
      certifierStore.reset(true);
    });
  };
}

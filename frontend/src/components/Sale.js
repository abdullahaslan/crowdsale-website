import { observer } from 'mobx-react';
import React, { Component } from 'react';
import { Container, Button, Header } from 'semantic-ui-react';

import AccountManager from './AccountManager';
import Buy from './Buy';
import Terms from './Terms';
import WalletCreator from './WalletCreator';

import accountStore from '../stores/account.store';
import appStore, { STEPS } from '../stores/app.store';

@observer
export default class Sale extends Component {
  render () {
    const { unlocked, wallet } = accountStore;
    const { step } = appStore;

    if (unlocked) {
      return this.renderBuy();
    }

    if (wallet || step === STEPS['load-wallet']) {
      return this.renderLoadWallet();
    }

    if (step === STEPS['create-wallet']) {
      return this.renderCreateWallet();
    }

    if (step === STEPS['home']) {
      return this.renderHome();
    }

    return null;
  }

  renderBuy () {
    return (
      <div>
        <Terms />
        <AccountManager />
        <Buy />
      </div>
    );
  }

  renderHome () {
    return (
      <Container textAlign='center'>
        <Header as='h3'>
          GET STARTED
        </Header>
        <p>
          Please note we require participants in the auction to verify
          their identity in compliance with OFAC requgulation, read
          more <a>here</a>.
        </p>

        <div>
          <Button
            onClick={this.handleLoadWallet}
            primary
          >
            Load wallet file
          </Button>

          <Button
            onClick={this.handleNoWallet}
          >
            I don&apos;t have a wallet
          </Button>
        </div>
      </Container>
    );
  }

  renderLoadWallet () {
    return (
      <Container textAlign='center'>
        <Header as='h3'>
          GET STARTED
        </Header>
        <AccountManager />
      </Container>
    );
  }

  renderCreateWallet () {
    return (
      <Container>
        <WalletCreator />
      </Container>
    );
  }

  handleLoadWallet = () => {
    appStore.goto('load-wallet');
  };

  handleNoWallet = () => {
    appStore.goto('create-wallet');
  };
}

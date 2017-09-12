import { observer } from 'mobx-react';
import React, { Component } from 'react';
import { Button, Container, Header, Loader, Segment } from 'semantic-ui-react';

import AccountInfo from './AccountInfo';
import Certifier from './Certifier';
import CountrySelector from './CountrySelector';
import Fee from './Fee';
import Step from './Step';
// import Stepper from './Stepper';

import appStore, { STEPS } from '../stores/app.store';
import feeStore from '../stores/fee.store';

const contentStyle = {
  backgroundColor: 'white',
  padding: '4em 2.5em'
};

@observer
export default class App extends Component {
  render () {
    const style = {
      textAlign: 'left'
    };

    const { padding } = appStore;

    if (padding) {
      style.paddingBottom = '2em';
      style.paddingTop = '5em';
    }

    const header = padding
      ? <Header as='h4'>PARITY IDENTITY CERTIFICATION</Header>
      : null;

    return (
      <div>
        <Container style={style}>
          {header}
          <Segment basic style={contentStyle}>
            {this.renderContent()}
          </Segment>
        </Container>
      </div>
    );
  }

  renderContent () {
    const { loading, step } = appStore;
    const { payer } = feeStore;

    if (loading) {
      return (
        <Loader active inline='centered' />
      );
    }

    if (step === STEPS['country-selection']) {
      return (
        <CountrySelector />
      );
    }

    if (step === STEPS['fee']) {
      return (
        <Fee />
      );
    }

    if (step === STEPS['certify']) {
      return <Certifier />;
    }

    if (step === STEPS['certified']) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Header as='h2'>
            YOUR ADDRESS IS NOW CERTIFIED TO YOUR IDENTITY
          </Header>

          <AccountInfo
            address={payer}
          />

          <Header as='h3'>
            Use this address to contribute during the Auction
          </Header>

          <Button primary size='large'>
            Return to Main Site
          </Button>
        </div>
      );
    }

    return null;
  }
}

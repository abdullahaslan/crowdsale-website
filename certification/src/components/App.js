import { observer } from 'mobx-react';
import React, { Component } from 'react';
import { Button, Container, Header, Loader, Segment } from 'semantic-ui-react';

import Fee from './Fee';
import Certifier from './Certifier';
import Step from './Step';
import CountrySelector from './CountrySelector';
// import Stepper from './Stepper';

import appStore, { STEPS } from '../stores/app.store';

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
        <Step
          description={`
            You can now use your wallet...
          `}
          title='YOUR ACCOUNT HAS BEEN CERTIFIED'
        >
          <div>
            <Button>
              Try Again
            </Button>
          </div>
        </Step>
      );
    }

    return null;
  }
}

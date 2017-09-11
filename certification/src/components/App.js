import { observer } from 'mobx-react';
import React, { Component } from 'react';
import { Container, Header, Loader, Segment } from 'semantic-ui-react';

import Fee from './Fee';
import Certifier from './Certifier';
// import Stepper from './Stepper';

import appStore, { STEPS } from '../stores/app.store';

const style = {
  paddingBottom: '2em',
  paddingTop: '5em',
  textAlign: 'left'
};

const contentStyle = {
  backgroundColor: 'white',
  padding: '4em 2.5em'
};

@observer
export default class App extends Component {
  render () {
    return (
      <div>
        <Container style={style}>
          <Header as='h4'>
            IDENTITY CERTIFICATION
          </Header>
          <br />
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

    if (step === STEPS['fee']) {
      return (
        <Fee />
      );
    }

    if (step === STEPS['certify']) {
      return <Certifier />;
    }

    return null;
  }
}

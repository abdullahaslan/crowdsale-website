import { observer } from 'mobx-react';
import React, { Component } from 'react';
import { Container, Header, Segment } from 'semantic-ui-react';

import Fee from './Fee';
import Stepper from './Stepper';

import appStore, { STEPS } from '../stores/app.store';

const style = {
  paddingBottom: '2em',
  paddingTop: '5em',
  textAlign: 'left'
};

const contentStyle = {
  backgroundColor: 'white',
  padding: '3em 1.5em'
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
          <Stepper
            steps={['First', 'Second', 'Third']}
            step={1}
          />
          <Segment basic style={contentStyle}>
            {this.renderContent()}
          </Segment>
        </Container>
      </div>
    );
  }

  renderContent () {
    const { step } = appStore;

    if (step === STEPS['fee']) {
      return (
        <Fee />
      );
    }

    return null;
  }
}

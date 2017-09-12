import { uniq } from 'lodash';
import { observer } from 'mobx-react';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Button, Form, Header, Message, Container, Segment } from 'semantic-ui-react';

import certifierStore from '../../stores/certifier.store';

@observer
export default class ParityCertifier extends Component {
  componentWillUnmount () {
    certifierStore.unmountOnfido();
  }

  render () {
    const { error, firstName, lastName, loading, onfido } = certifierStore;

    if (onfido) {
      return this.renderOnfidoForm();
    }

    const valid = firstName && firstName.length >= 2 &&
      lastName && lastName.length >= 2;

    return (
      <Container>
        <Header content='VERIFYING IDENTITY WITH PARITY' />
        <Segment basic>
          <Form
            error={!!error}
          >
            {this.renderError()}

            <Form.Field>
              <Form.Input
                label='First Name'
                onChange={this.handleFirstNameChange}
                placeholder='First Name'
                value={firstName}
              />
            </Form.Field>
            <Form.Field>
              <Form.Input
                label='Last Name'
                onChange={this.handleLastNameChange}
                placeholder='Last Name'
                value={lastName}
              />
            </Form.Field>
          </Form>
        </Segment>
        <Segment basic style={{ textAlign: 'right' }}>
          <Button
            disabled={!valid || loading}
            loading={loading}
            onClick={this.handleNext}
            primary
          >
            {
              loading
                ? 'Loading...'
                : 'Next'
            }
          </Button>
        </Segment>
      </Container>
    );
  }

  renderError () {
    const { error } = certifierStore;

    if (!error) {
      return null;
    }

    return (
      <Message
        error
        header='Error'
        content={error.message}
      />
    );
  }

  renderOnfidoForm () {
    return (
      <Container>
        <Segment basic>
          {this.renderError()}
          <div id='onfido-mount' ref={this.handleSetOnfidoElt} />
        </Segment>
      </Container>
    );
  }

  handleFirstNameChange = (event) => {
    const firstName = event.target.value;

    certifierStore.setFirstName(firstName);
  };

  handleLastNameChange = (event) => {
    const lastName = event.target.value;

    certifierStore.setLastName(lastName);
  };

  handleNext = () => {
    certifierStore.createApplicant();
  };

  handleSetOnfidoElt = () => {
    certifierStore.mountOnfido();
  }
}

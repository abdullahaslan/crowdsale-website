import { countries } from 'country-data';
import { uniq } from 'lodash';
import { observer } from 'mobx-react';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Button, Form, Header, Message, Container, Segment } from 'semantic-ui-react';

import certifierStore from '../../stores/certifier.store';

const COUNTRIES_BLACKLIST = [
  'JPN'
];

const countryCodes = countries.all
  .filter((c) => c.status === 'assigned')
  .filter((c) => !COUNTRIES_BLACKLIST.includes(c.alpha3))
  .map((c) => c.alpha3);

const countryOptions = uniq(countryCodes)
  .map((code) => {
    const country = countries[code];

    return {
      key: country.alpha2,
      text: country.name,
      value: country.alpha3,
      flag: country.alpha2.toLowerCase()
    };
  })
  .sort((cA, cB) => cA.text.localeCompare(cB.text));

const CountryDropdown = (props) => {
  return (
    <Form.Dropdown
      label='Country'
      placeholder='Select Country'
      fluid
      search
      selection
      options={countryOptions}
      onChange={props.onChange}
      value={props.value}
    />
  );
};

CountryDropdown.propTypes = {
  onChange: PropTypes.func.isRequired,
  value: PropTypes.string.isRequired
};

@observer
export default class ParityCertifier extends Component {
  componentWillUnmount () {
    certifierStore.unmountOnfido();
  }

  render () {
    const { country, error, firstName, lastName, loading, onfido } = certifierStore;

    if (onfido) {
      return this.renderOnfidoForm();
    }

    return (
      <Container>
        <Header content='VERIFYING WITH PARITY' />
        <Segment basic>
          <Form
            error={!!error}
          >
            {this.renderError()}
            <Form.Field>
              <CountryDropdown
                onChange={this.handleCountryChange}
                value={country}
              />
            </Form.Field>

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
        <Segment basic>
          <Button
            disabled={!firstName || !lastName || !country || loading}
            loading={loading}
            onClick={this.handleNext}
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

  handleCountryChange = (_, data) => {
    const { value } = data;

    certifierStore.setCountry(value);
  };

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

import { countries } from 'country-data';
import Datamap from 'datamaps';
import React, { Component } from 'react';
import { Button, Card, Header, Icon, Modal } from 'semantic-ui-react';

import appStore from '../stores/app.store';

const VALID_COLOR = '#4a90e2';
const INVALID_COLOR = '#4d4d4d';
const BACKGROUND_COLOR = '#f2f2f2';

const BLACKLISTED_COUNTRIES_KEYS = [
  'USA', 'JPN'
].filter((countryKey) => {
  if (!countries[countryKey]) {
    console.error(new Error('Unkown country key: ' + countryKey));
    return false;
  }

  return true;
});

const BLACKLISTED_COUNTRIES_NAMES = BLACKLISTED_COUNTRIES_KEYS
  .map((countryKey) => countries[countryKey].name);

const mapStyle = {
  backgroundColor: BACKGROUND_COLOR,
  // height: 400,
  // margin: '0 2em 1em',
  padding: '1.5em 1em',
  borderRadius: '1em'
};

const panelStyle = {
  flex: 1,
  margin: '0 2em'
};

export default class CountrySelector extends Component {
  state = {
    showInvalidModal: false
  };

  componentWillMount () {
    window.addEventListener('resize', this.resize);
  }

  componentWillUnmount () {
    window.removeEventListener('resize', this.resize);
  }

  render () {
    return (
      <div>
        <Header as='h2' textAlign='center'>
          CHOOSE YOUR CITIZENSHIP
        </Header>

        {this.renderModal()}

        <div style={{ display: 'flex', width: '100%', marginTop: '4em' }}>
          <div style={panelStyle}>
            <Card fluid link style={mapStyle} onClick={this.handleInvalid}>
              <div ref={this.setInvalidRef} />
            </Card>

            <div style={{ textAlign: 'center' }}>
              <p>
                <span>{BLACKLISTED_COUNTRIES_NAMES.slice(0, -1).join(', ')} </span>
                <span>and {BLACKLISTED_COUNTRIES_NAMES.slice(-1)[0]}.</span>
              </p>
              <p style={{
                color: 'red',
                fontWeight: 'bold'
              }}>
                ( For legal reasons can not take part in the sale )
              </p>
            </div>
          </div>

          <div style={panelStyle}>
            <Card fluid link style={mapStyle} onClick={this.handleValid}>
              <div ref={this.setValidRef} />
            </Card>

            <div style={{ textAlign: 'center' }}>
              <p>Rest of world.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  renderModal () {
    const { showInvalidModal } = this.state;

    return (
      <Modal
        basic
        open={showInvalidModal}
        onClose={this.handleCloseInvalid}
        size='small'
      >
        <Header icon='world' content='Unfortunately, you cannot continue...' />
        <Modal.Content>
          <p>
            Citizens of this country cannot participate in the sale.
            Citizens of this country cannot participate in the sale.
            Citizens of this country cannot participate in the sale.
            Citizens of this country cannot participate in the sale.
          </p>
        </Modal.Content>
        <Modal.Actions>
          <Button inverted onClick={this.handleCloseInvalid}>
            <Icon name='close' /> Close
          </Button>
        </Modal.Actions>
      </Modal>
    );
  }

  resize = () => {
    if (!this.invalidMap || !this.validMap) {
      return;
    }

    this.invalidMap.resize();
    this.validMap.resize();
  };

  createMap = (element, invalid = false) => {
    const data = BLACKLISTED_COUNTRIES_KEYS.reduce((data, countryKey) => {
      data[countryKey] = { fillKey: 'DISABLED' };
      return data;
    }, {});

    return new Datamap({
      projection: 'mercator',
      geographyConfig: {
        highlightOnHover: false,
        popupOnHover: false
      },
      fills: {
        defaultFill: invalid ? INVALID_COLOR : VALID_COLOR,
        DISABLED: invalid ? VALID_COLOR : INVALID_COLOR
      },
      responsive: true,
      element,
      data
    });
  };

  handleCloseInvalid = () => {
    this.setState({ showInvalidModal: false });
  };

  handleInvalid = () => {
    this.setState({ showInvalidModal: true });
  };

  handleValid = () => {
    appStore.goto('fee');
  };

  setInvalidRef = (element) => {
    if (!element) {
      return;
    }

    this.invalidMap = this.createMap(element, true);
  };

  setValidRef = (element) => {
    if (!element) {
      return;
    }

    this.validMap = this.createMap(element, false);
  };
}

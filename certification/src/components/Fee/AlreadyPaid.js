import { observer } from 'mobx-react';
import React, { Component } from 'react';
import { Button } from 'semantic-ui-react';

import feeStore from '../../stores/fee.store';

import AddressInput from '../AddressInput';
import Step from '../Step';

@observer
export default class AlreadyPaid extends Component {
  render () {
    const { who, valid } = feeStore;

    return (
      <Step
        description={`
          The number of tokens related to the previous contributions
          made before the drop in price will be recalculated and the
          number of tokens allocated to them will be increased to
          match the new lower price.
        `}
        title='YOU ALREADY PAID FOR THE FEE'
      >
        <div>
          <p><b>
            Enter the Ethereum address you used to pay for the fee
          </b></p>

          <AddressInput
            onChange={this.handleWhoChange}
            value={who}
          />

          <div style={{ textAlign: 'right' }}>
            <Button secondary onClick={this.handleBack}>
              Back
            </Button>
            <Button primary disabled={!valid} onClick={this.handleSendPayment}>
              Next
            </Button>
          </div>
        </div>
      </Step>
    );
  }

  handleBack = () => {
    return feeStore.goto('waiting-payment');
  };

  handleSendPayment = () => {
    const { valid } = feeStore;

    if (!valid) {
      return;
    }

    feeStore.sendPayment();
  };

  handleWhoChange = (_, { value }) => {
    feeStore.setWho(value);
  };
}

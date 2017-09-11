import { observer } from 'mobx-react';
import React, { Component } from 'react';
import { Button, Header } from 'semantic-ui-react';
import QRCode from 'qrcode.react';

import { fromWei } from '../../utils';

import feeStore from '../../stores/fee.store';

import AccountInfo from '../AccountInfo';
import Step from '../Step';

@observer
export default class WaitingPayment extends Component {
  componentWillMount () {
    feeStore.watch();
  }

  componentWillUnmount () {
    feeStore.unwatch();
  }

  render () {
    const { account, requiredEth, wallet } = feeStore;

    if (account === null || requiredEth === null || wallet === null) {
      return null;
    }

    return (
      <Step
        description={`
          This is the certifier...
        `}
        title='WELCOME TO THE CERTIFIER'
      >
        <div>
          <Header
            as='h4'
            textAlign='center'
          >
            PLEASE SEND { fromWei(requiredEth).toFormat() } ETH TO THE
            ADDRESS BELOW
          </Header>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            padding: '1.5em 0',
            flexDirection: 'column'
          }}>
            <AccountInfo
              address={wallet.address}
              balance={account.balance}
            />

            <br />

            <QRCode
              level='M'
              size={192}
              value={`ethereum:${wallet.address}?value=${requiredEth.toNumber()}&gas=21000`}
            />

            <span style={{
              margin: '1.5em 0',
              color: 'red',
              fontSize: '1.25em'
            }}>
              Waiting for transaction...
            </span>

            <Button
              content='I already paid'
              onClick={this.handleAlreadyPaid}
              primary
              size='big'
            />
          </div>
        </div>
      </Step>
    );
  }

  handleAlreadyPaid = () => {
    feeStore.goto('already-paid');
  };
}

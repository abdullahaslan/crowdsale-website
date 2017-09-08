import { observer } from 'mobx-react';
import React, { Component } from 'react';
import { Button, Container, Dimmer, Divider, Header, Icon, Loader, Segment } from 'semantic-ui-react';
import QRCode from 'qrcode.react';

import { fromWei } from '../utils';
import feeStore from '../stores/fee.store';

import AccountInfo from './AccountInfo';

@observer
export default class Fee extends Component {
  render () {
    const { fee, wallet } = feeStore;

    if (fee === null || wallet === null) {
      return null;
    }

    return (
      <div>
        <Header
          as='h3'
          textAlign='center'
        >
          PLEASE ADD { fromWei(fee).toFormat() } ETH TO THE
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
          />

          <br />

          <QRCode
            level='M'
            size={192}
            value={`ethereum:${wallet.address}?value=${fee.toNumber()}&gas=21000`}
          />

          <span style={{
            marginTop: '1.5em',
            color: 'red',
            fontSize: '1.25em'
          }}>
            Waiting for transaction...
          </span>
        </div>
      </div>
    );
  }
}

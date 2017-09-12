import React, { Component } from 'react';
import { Grid, Header } from 'semantic-ui-react';

import feeStore from '../../stores/fee.store';

export default class SendingPayment extends Component {
  componentWillMount () {
    feeStore.watchPayer();
  }

  componentWillUnmount () {
    feeStore.unwatchPayer();
  }

  render () {
    return (
      <Grid>
        <Grid.Column width={6}>
          <Header as='h3'>
            RECORDING YOUR PAYMENT ON THE BLOCKCHAIN
          </Header>
          <div style={{ lineHeight: '2em' }}>
            <p>
              The number of tokens related to the previous contributions
              made before the drop in price will be recalculated and the
              number of tokens allocated to them will be increased to
              match the new lower price.
            </p>
          </div>
        </Grid.Column>
        <Grid.Column width={10}>
          <p><b>
            Please wait until you payment has been recorded on the blockchain.
          </b></p>
        </Grid.Column>
      </Grid>
    );
  }
}

import React, { Component } from 'react';
import { Card, Grid, Header, Image } from 'semantic-ui-react';

import ExchangeImg from '../../images/exchange.png';
import EthereumImg from '../../images/ethereum.png';

import feeStore from '../../stores/fee.store';

export default class AccountType extends Component {
  render () {
    return (
      <Grid>
        <Grid.Column width={6}>
          <Header as='h3'>
            HOW DID YOU SEND ETHER?
          </Header>
          <div style={{ lineHeight: '2em' }}>
            <p>
              The number of tokens related to the previous contributions
              made before the drop in price will be recalculated and the
              number of tokens allocated to them will be increased to
              match the new lower price.
            </p>

            <p>
              The auction will stop when the recalculation of the price of
              the tokens already paid for matches the total amount of
              tokens for sale.
            </p>
          </div>
        </Grid.Column>
        <Grid.Column width={10}>
          <Card.Group itemsPerRow={2}>
            <Card onClick={this.handleFromExchange}>
              <Image src={ExchangeImg} />
              <Card.Content>
                <Card.Header>
                  From an exchange
                </Card.Header>
                <Card.Description>
                  You sent some ETH from an exchange
                  as Kraken, Coinbase, etc.
                </Card.Description>
              </Card.Content>
            </Card>

            <Card onClick={this.handleFromPersonal}>
              <Image src={EthereumImg} />
              <Card.Content>
                <Card.Header>
                  From a personal Wallet
                </Card.Header>
                <Card.Description>
                  You sent some ETH from a Wallet you
                  have full access too, using Parity Wallet,
                  MyEtherWallet, etc.
                </Card.Description>
              </Card.Content>
            </Card>
          </Card.Group>
        </Grid.Column>
      </Grid>
    );
  }

  handleFromExchange = () => {
    feeStore.goto('from-exchange');
  };

  handleFromPersonal = () => {
    feeStore.goto('from-personal');
  };
}

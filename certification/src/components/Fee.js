import { observer } from 'mobx-react';
import keycode from 'keycode';
import React, { Component } from 'react';
import { Button, Card, Grid, Header, Image, Input, Segment } from 'semantic-ui-react';
import { AccountIcon } from 'parity-reactive-ui';
import QRCode from 'qrcode.react';

import ExchangeImg from '../images/exchange.png';
import EthereumImg from '../images/ethereum.png';
import { fromWei } from '../utils';
import feeStore, { STEPS } from '../stores/fee.store';

import AccountCreator from './AccountCreator';
import AccountInfo from './AccountInfo';

@observer
export default class Fee extends Component {
  render () {
    const { step } = feeStore;

    if (step === STEPS['waiting-payment']) {
      return this.renderWaitingPayment();
    }

    if (step === STEPS['account-selection']) {
      return this.renderAccountSelection();
    }

    if (step === STEPS['from-exchange']) {
      return this.renderFromExchange();
    }

    return null;
  }

  renderAccountSelection () {
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

  renderFromExchange () {
    return (
      <AccountCreator />
    );
  }

  renderFromPersonal () {
    const { valid, who } = feeStore;

    return (
      <Grid>
        <Grid.Column width={6}>
          <Header as='h3'>
            YOU SENT ETHER FROM AN EXCHANGE
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
          <p><b>
            Enter the Ethereum address you would like
            to certify
          </b></p>
          <Segment>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {
                valid
                  ? (
                    <AccountIcon
                      address={who}
                      style={{ height: 48, marginRight: '1em' }}
                    />
                  )
                  : (
                    <span
                      style={{
                        backgroundColor: 'lightgray',
                        borderRadius: '50%',
                        height: '48px',
                        width: '48px',
                        marginRight: '1em'
                      }}
                    />
                  )
              }

              <div style={{ flex: 1 }}>
                <Input
                  action={{ icon: 'camera' }}
                  fluid
                  placeholder='0x...'
                  onChange={this.handleWhoChange}
                  onKeyUp={this.handleKeyUp}
                  value={who}
                />
              </div>
            </div>
          </Segment>

          <div style={{ textAlign: 'right' }}>
            <Button secondary onClick={this.handleBack}>
              Back
            </Button>
            <Button primary disabled={!valid} onClick={this.handleNext}>
              Next
            </Button>
          </div>
        </Grid.Column>
      </Grid>
    );
  }

  renderWaitingPayment () {
    const { account, fee, wallet } = feeStore;

    if (account === null || fee === null || wallet === null) {
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
            balance={account.balance}
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

  handleBack = () => {
    feeStore.goto('account-selection');
  };

  handleFromExchange = () => {
    feeStore.goto('from-exchange');
  };

  handleFromPersonal = () => {

  };

  handleKeyUp = (event) => {
    const code = keycode(event);

    if (code === 'enter') {
      this.handleNext();
    }
  };

  handleNext = () => {
    const { valid } = feeStore;

    if (!valid) {
      return;
    }
  };

  handleWhoChange = (_, { value }) => {
    feeStore.setWho(value);
  };
}

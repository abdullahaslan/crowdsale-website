import { observer } from 'mobx-react';
import keycode from 'keycode';
import React, { Component } from 'react';
import { Button, Card, Grid, Header, Image, Input, Segment } from 'semantic-ui-react';
import { AccountIcon } from 'parity-reactive-ui';
import QRCode from 'qrcode.react';

import ExchangeImg from '../images/exchange.png';
import EthereumImg from '../images/ethereum.png';
import { fromWei } from '../utils';

import appStore from '../stores/app.store';
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

    if (step === STEPS['from-personal']) {
      return this.renderFromPersonal();
    }

    if (step === STEPS['sending-payment']) {
      return this.renderSendingPayment();
    }

    return null;
  }

  renderSendingPayment () {
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
      <AccountCreator
        onCancel={this.handleGotoAccountSelection}
        onDone={this.handleSendPayment}
      />
    );
  }

  renderFromPersonal () {
    const { account, valid, who } = feeStore;

    return (
      <Grid>
        <Grid.Column width={6}>
          <Header as='h3'>
            YOU SENT ETHER FROM A PERSONAL WALLET
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
          {this.renderPersonalIncomingChoices(['0x00278e7c9058Fe6D963f34466C2B3c03D81f63af', '0x5F0281910Af44bFb5fC7e86A404d0304B0e042F1'] || account.incomingTxAddr)}
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
                  onChange={this.handleWhoChange}
                  onKeyUp={this.handleKeyUp}
                  placeholder='0x...'
                  ref={this.setPersonalInputRef}
                  value={who}
                />
              </div>
            </div>
          </Segment>

          <div style={{ textAlign: 'right' }}>
            <Button secondary onClick={this.handleBack}>
              Back
            </Button>
            <Button primary disabled={!valid} onClick={this.handleSendPayment}>
              Next
            </Button>
          </div>
        </Grid.Column>
      </Grid>
    );
  }

  renderPersonalIncomingChoices (addresses) {
    if (addresses.length === 0) {
      return null;
    }

    return (
      <div>
        <p>
          <b>
            We have detected incoming transactions from these addresses.
          </b>
          <br />
          If you wish you can use one of those.
        </p>

        {addresses.map((address) => {
          const onClick = () => {
            feeStore.setWho(address);

            // Focus on the input field if possible
            setTimeout(() => {
              if (this.personalInput) {
                this.personalInput.focus();
              }
            }, 50);
          };

          return (
            <div style={{ marginBottom: '0.75em' }}>
              <AccountInfo
                address={address}
                key={address}
                onClick={onClick}
              />
            </div>
          );
        })}
        <br />
      </div>
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
          PLEASE SEND { fromWei(fee).toFormat() } ETH TO THE
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

  handleGotoAccountSelection = () => {
    feeStore.goto('account-selection');
  };

  handleCertify = () => {
    appStore.goto('certification');
  };

  handleFromExchange = () => {
    feeStore.goto('from-exchange');
  };

  handleFromPersonal = () => {
    feeStore.goto('from-personal');
  };

  handleKeyUp = (event) => {
    const code = keycode(event);

    if (code === 'enter') {
      this.handleSendPayment();
    }
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

  setPersonalInputRef = (element) => {
    this.personalInput = element;
  };
}

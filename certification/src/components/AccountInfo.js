import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { AccountIcon } from 'parity-reactive-ui';
import { Segment } from 'semantic-ui-react';

import backend from '../backend';
import { fromWei } from '../utils';

export default class AccountInfo extends Component {
  static propTypes = {
    address: PropTypes.string.isRequired,
    balance: PropTypes.object,
    showCertified: PropTypes.bool,
    onClick: PropTypes.func
  };

  static defaultProps = {
    showCertified: true
  };

  state = {
    balance: null,
    certified: null
  };

  componentWillMount () {
    this.fetchInfo();
  }

  componentWillReceiveProps (nextProps) {
    if (nextProps.address !== this.props.address) {
      this.fetchInfo(nextProps);
    }
  }

  async fetchInfo (props = this.props) {
    const { address, showCertified } = props;
    const { balance } = await backend.getAccountFeeInfo(address);

    const nextState = { balance };

    if (showCertified) {
      const { certified } = await backend.checkStatus(address);

      nextState.certified = certified;
    }

    this.setState(nextState);
  }

  render () {
    const { address, onClick } = this.props;
    const { certified } = this.state;

    const style = { padding: '0.75em 1em 0.75em 0.5em' };

    if (onClick) {
      style.cursor = 'pointer';
    }

    if (certified !== null) {
      style.color = certified
        ? 'green'
        : 'red';
    }

    return (
      <Segment compact style={style} onClick={onClick}>
        <div style={{ display: 'flex' }}>
          <div style={{ marginRight: '1em', flex: '0 0 auto' }}>
            <AccountIcon
              address={address}
              style={{ height: 48 }}
            />
          </div>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-around',
            wordBreak: 'break-all',
            position: 'relative'
          }}>
            <span style={{
              fontFamily: 'monospace',
              fontSize: '1.0em'
            }}>
              {address}
            </span>
            {this.renderBalance()}
            {this.renderCertified()}
          </div>
        </div>
      </Segment>
    );
  }

  renderBalance () {
    const { balance } = this.state;

    if (!balance) {
      return null;
    }

    return (
      <span>
        Current funds: {fromWei(balance).toFormat()} ETH
      </span>
    );
  }

  renderCertified () {
    const { showCertified } = this.props;
    const { certified } = this.state;

    if (certified === null || !showCertified) {
      return null;
    }

    const color = certified
      ? 'green'
      : 'red';

    const style = {
      borderColor: color,
      borderRadius: '1em',
      borderStyle: 'solid',
      borderWidth: '2px',
      color: color,
      fontSize: '0.85em',
      fontWeight: 'bold',
      padding: '0em 0.5em',

      position: 'absolute',
      bottom: '-0.25em',
      right: '-0.5em'
    };

    return (
      <div style={style}>
        Identity {certified ? '' : 'not'} certified
      </div>
    );
  }
}

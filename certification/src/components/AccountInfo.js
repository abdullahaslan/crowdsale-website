import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { AccountIcon } from 'parity-reactive-ui';
import { Segment } from 'semantic-ui-react';

import { fromWei } from '../utils';

export default class AccountInfo extends Component {
  static propTypes = {
    address: PropTypes.string.isRequired,
    balance: PropTypes.object,
    onClick: PropTypes.func
  };

  static defaultProps = {
    certified: false
  };

  render () {
    const { address, onClick } = this.props;
    const style = { padding: '0.75em 1em 0.75em 0.5em' };

    if (onClick) {
      style.cursor = 'pointer';
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
            wordBreak: 'break-all'
          }}>
            <span style={{
              fontFamily: 'monospace',
              fontSize: '1.0em'
            }}>
              {address}
            </span>
            {this.renderBalance()}
          </div>
        </div>
      </Segment>
    );
  }

  renderBalance () {
    const { balance } = this.props;

    if (!balance) {
      return null;
    }

    return (
      <span>
        Current funds: {fromWei(balance).toFormat()} ETH
      </span>
    );
  }
}

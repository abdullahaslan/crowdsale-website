import { observer } from 'mobx-react';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { AccountIcon } from 'parity-reactive-ui';
import { Button, Icon, Label, Popup, Segment } from 'semantic-ui-react';

import { fromWei } from '../utils';

const hSpaceStyle = {
  width: '0.5em'
};

@observer
export default class AccountInfo extends Component {
  static propTypes = {
    address: PropTypes.string.isRequired,
    balance: PropTypes.object,
    certified: PropTypes.bool,
    onLogout: PropTypes.func
  };

  static defaultProps = {
    certified: false
  };

  render () {
    const { address, certified, onLogout } = this.props;
    let color = 'yellow';

    if (certified !== null) {
      color = certified
        ? 'green'
        : 'red';
    }

    const certifiedIcon = certified !== false
      ? null
      : (
        <span>
          <span style={hSpaceStyle}>&nbsp;</span>
          <Popup
            content={`
              Lorem ipsum dolor sit amet,
              consectetur adipiscing elit.
              Pellentesque urna erat, lacinia
              vitae mollis finibus, consequat in
              tortor. Sed nec elementum tortor.
            `}
            size='small'
            trigger={<Icon name='info circle' />}
          />
        </span>
      );

    const logoutButton = onLogout
      ? (
        <Button
          size='tiny'
          color='orange'
          icon='log out'
          onClick={onLogout}
        />
      )
      : null;

    return (
      <Segment compact style={{ padding: '0.75em 1em 0.75em 0.5em' }}>
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
              fontSize: '1.15em'
            }}>
              {address}
            </span>
            <span>
              Current funds: {this.renderBalance()} ETH
            </span>
          </div>
        </div>
      </Segment>
    );
  }

  renderBalance () {
    const { balance } = this.props;

    if (!balance) {
      return '0.000';
    }

    return fromWei(balance).toFormat(3);
  }
}

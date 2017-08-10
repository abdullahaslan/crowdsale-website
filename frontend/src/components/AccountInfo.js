import { observer } from 'mobx-react';
import React, { Component } from 'react';
import PropTypes from 'proptypes';
import { AccountIcon } from 'parity-reactive-ui';
import { Icon, Label, Popup } from 'semantic-ui-react';

const hSpaceStyle = {
  width: '0.5em'
};

@observer
export default class AccountInfo extends Component {
  static propTypes = {
    address: PropTypes.string.isRequired,
    certified: PropTypes.bool
  };

  static defaultProps = {
    certified: false
  };

  render () {
    const { address, certified } = this.props;
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

    return (
      <div style={{
        alignItems: 'center',
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center'
      }}>
        <AccountIcon
          address={address}
          style={{ height: 32 }}
        />
        <Label
          color={color}
          size='large'
          style={{
            marginLeft: '0.5em'
          }}
        >
          {address}
        </Label>
        {certifiedIcon}
      </div>
    );
  }
}

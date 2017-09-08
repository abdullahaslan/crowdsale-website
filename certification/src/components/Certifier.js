import { observer } from 'mobx-react';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import Recaptcha from 'react-google-recaptcha';
import { Button, Header, Container, Segment } from 'semantic-ui-react';

import Certifiers from './Certifiers';

import certifierStore from '../stores/certifier.store';

const STEPS = {
  HOME: Symbol('home'),
  VERIFY_WITH_KRAKEN: Symbol('verify-kraken'),
  VERIFY_WITH_PARITY: Symbol('verify-parity')
};

@observer
export default class Certifier extends Component {
  static propTypes = {
    disabled: PropTypes.bool
  };

  static initialState = {
    step: STEPS.HOME
  };

  state = Certifier.initialState;

  componentWillUnmount () {
    this.reset();
  }

  render () {
    const { pending } = certifierStore;
    const { disabled } = this.props;

    return (
      <div>
        {this.renderModal()}
      </div>
    );
  }

  renderModal () {
    const { step } = this.state;

    if (step === STEPS.HOME) {
      return this.renderHome();
    }

    if (step === STEPS.VERIFY_WITH_PARITY) {
      return this.renderVerifyParity();
    }

    if (step === STEPS.VERIFY_WITH_KRAKEN) {
      return this.renderVerifyKraken();
    }

    return null;
  }

  renderHome () {
    const { stoken } = certifierStore;

    return (
      <Container>
        <Header content='VERIFYING YOUR IDENTITY' />
        <Segment basic>
          <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam est urna, pulvinar quis lorem id, blandit luctus lectus. Vivamus mattis leo dui, at gravida enim lacinia eu. Nullam commodo, quam sagittis mollis aliquam, est magna tincidunt velit, in ultrices ligula purus ut tellus. In tempor lorem vel mattis semper. Vestibulum elementum hendrerit egestas. Phasellus eu viverra sapien. Integer eleifend blandit aliquet. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Nunc eu tempus nisi. Nam convallis purus ac neque luctus, et semper augue suscipit. Proin nec finibus neque, varius fringilla arcu. Nunc ultrices felis tincidunt tortor vestibulum eleifend. Integer eros nisi, volutpat eu neque et, fringilla elementum massa. Integer a accumsan neque.
          </p>
          <p>
            Vestibulum erat turpis, accumsan quis porta at, consequat at arcu. Aliquam placerat et orci eget facilisis. Nam fermentum sodales sapien ut ultrices. Donec porta ante nec risus sollicitudin condimentum. Aliquam et tortor felis. Quisque vestibulum eu purus luctus scelerisque. Sed in mauris lorem. Vestibulum nibh mi, auctor sit amet condimentum vel, auctor id lectus. Aenean facilisis risus diam, quis bibendum diam aliquet in. Etiam sagittis non metus nec gravida. Cras mi massa, varius sit amet bibendum id, interdum eu elit. Nulla molestie felis tortor, sed interdum nunc porttitor sit amet. Vestibulum tincidunt porttitor eros, finibus aliquet orci tincidunt ac. Sed vel elit vel elit iaculis tempus. Morbi porttitor efficitur pellentesque.
          </p>
        </Segment>
        <Segment basic>
          <div style={{
            display: 'flex',
            justifyContent: 'center'
          }}>
            <Recaptcha
              onChange={this.handleRecaptcha}
              sitekey='6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI'
              theme='light'
            />
          </div>
        </Segment>
        <Segment basic>
          <Button
            disabled={!stoken}
            onClick={this.handleVerifyKraken}
          >
            Verify with Kraken
          </Button>
          <Button
            disabled={!stoken}
            onClick={this.handleVerifyParity}
          >
            Verify with Parity
          </Button>
        </Segment>
      </Container>
    );
  }

  renderVerifyKraken () {
    return (
      <Certifiers.Kraken onClose={this.handleClose} />
    );
  }

  renderVerifyParity () {
    return (
      <Certifiers.Parity
        onClose={this.handleClose}
      />
    );
  }

  handleCertify = () => {
    certifierStore.setOpen(true);
  };

  handleClose = () => {
    this.reset();
    certifierStore.setOpen(false);
  };

  handleRecaptcha = (stoken) => {
    certifierStore.setSToken(stoken);
  };

  handleVerifyKraken = () => {
    this.setState({ step: STEPS.VERIFY_WITH_KRAKEN });
  };

  handleVerifyParity = () => {
    this.setState({ step: STEPS.VERIFY_WITH_PARITY });
  };

  reset = () => {
    this.setState(Certifier.initialState, () => {
      certifierStore.reset(true);
    });
  };
}

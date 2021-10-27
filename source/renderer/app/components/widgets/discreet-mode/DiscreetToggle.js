// @flow
import React from 'react';
import SVGInline from 'react-svg-inline';
import classNames from 'classnames';
import { observer } from 'mobx-react';
import { PopOver } from 'react-polymorph/lib/components/PopOver';
import { defineMessages, intlShape, injectIntl } from 'react-intl';
import revealIcon from '../../../assets/images/reveal-key.inline.svg';
import hideIcon from '../../../assets/images/hide-key.inline.svg';

import styles from './DiscreetToggle.scss';

const messages = defineMessages({
  discreetModeOn: {
    id: 'widgets.discreetToggle.on',
    defaultMessage: 'Toggle discreet mode on',
    description:
      'Text for the tooltip on "discreet mode" button when mode is on',
  },
  discreetModeOff: {
    id: 'widgets.discreetToggle.off',
    defaultMessage: 'Toggle discreet mode off',
    description:
      'Text for the tooltip on "discreet mode" button when mode is off',
  },
});

type Props = {
  hasTadaIcon?: boolean,
  intl: intlShape.isRequired,
  isDiscreetMode?: Boolean,
  onToggle: Function,
};

export const DiscreetToggle = injectIntl(
  observer(({ hasTadaIcon, intl, isDiscreetMode = true, onToggle }: Props) => {
    const rootClasses = classNames([
      styles.root,
      hasTadaIcon && styles.hasTadaIcon,
    ]);

    return (
      <div className={rootClasses}>
        <PopOver
          themeVariables={{
            '--rp-pop-over-arrow-size': '15px',
            '--rp-pop-over-bg-color':
              'var(--theme-node-sync-info-message-background-color)',
            '--rp-pop-over-text-color':
              'var(--theme-node-sync-info-message-text-color)',
          }}
          content={
            <span className={styles.tooltip}>
              {intl.formatMessage(
                messages[isDiscreetMode ? 'discreetModeOff' : 'discreetModeOn']
              )}
            </span>
          }
        >
          <button className={styles.button} onClick={onToggle}>
            <SVGInline
              svg={isDiscreetMode ? hideIcon : revealIcon}
              className={styles.icon}
            />
          </button>
        </PopOver>
      </div>
    );
  })
);

// Similarily to the DrawerLayout component this deserves to be put in a
// separate repo. ALthough, keeping it here for the time being will allow us
// to move faster and fix possible issues quicker

import React, { Component } from 'react';
import { Animated, StyleSheet, View, Keyboard, StatusBar } from 'react-native';

import {
  PanGestureHandler,
  TapGestureHandler,
  State,
} from 'react-native-gesture-handler';

const DRAG_TOSS = 0.05;

export default class Swipeable extends Component {
  static defaultProps = {
    friction: 1,
    useNativeAnimations: true,
  };

  constructor(props) {
    super(props);
    const dragX = new Animated.Value(0);
    const rowTranslation = new Animated.Value(0);
    this.state = { dragX, rowTranslation, rowState: 0 };
    this._updateAnimatedEvent(props, this.state);
  }

  componentWillUpdate(props, state) {
    if (
      this.props.friction !== props.friction ||
      this.state.leftWidth !== state.leftWidth ||
      this.state.rightOffset !== state.rightOffset ||
      this.state.rowWidth !== state.rowWidth
    ) {
      this._updateAnimatedEvent(props, state);
    }
  }

  _updateAnimatedEvent = (props, state) => {
    const { friction, useNativeAnimations } = props;
    const {
      dragX,
      rowTranslation,
      leftWidth = 1,
      rowWidth = 1,
      rightOffset = 0,
    } = state;
    const rightWidth = Math.max(0, rowWidth - rightOffset);

    this._transX = Animated.add(
      rowTranslation,
      dragX.interpolate({
        inputRange: [0, friction],
        outputRange: [0, 1],
      })
    );
    this._showLeftAction = this._transX.interpolate({
      inputRange: [-1, 0, leftWidth],
      outputRange: [0, 0, 1],
    });
    this._leftActionOpacity = this._showLeftAction.interpolate({
      inputRange: [0, Number.MIN_VALUE],
      outputRange: [0, 1],
    });
    this._showRightAction = this._transX.interpolate({
      inputRange: [-rightWidth, 0, 1],
      outputRange: [1, 0, 0],
    });
    this._rightActionOpacity = this._showRightAction.interpolate({
      inputRange: [0, Number.MIN_VALUE],
      outputRange: [0, 1],
    });
    this._onGestureEvent = Animated.event(
      [{ nativeEvent: { translationX: this.state.dragX } }],
      { useNativeDriver: useNativeAnimations }
    );
  };

  _onTapHandlerStateChange = ({ nativeEvent }) => {
    if (nativeEvent.oldState === State.ACTIVE) {
      this.close();
    }
  };

  _onHandlerStateChange = ({ nativeEvent }) => {
    if (nativeEvent.oldState === State.ACTIVE) {
      this._handleRelease(nativeEvent);
    }
  };

  _handleRelease = nativeEvent => {
    const { velocityX, translationX: dragX } = nativeEvent;
    const { leftWidth, rowWidth, rightOffset, rowState } = this.state;
    const rightWidth = rowWidth - rightOffset;
    const {
      friction,
      leftThreshold = leftWidth / 2,
      rightThreshold = rightWidth / 2,
    } = this.props;

    const startOffsetX = this._currentOffset() + dragX / friction;
    const translationX = (dragX + DRAG_TOSS * velocityX) / friction;

    let toValue = 0;
    if (rowState === 0) {
      if (translationX > leftThreshold) {
        toValue = leftWidth;
      } else if (translationX < -rightThreshold) {
        toValue = -rightWidth;
      }
    } else if (rowState === 1) {
      // swiped to left
      if (translationX > -leftThreshold) {
        toValue = leftWidth;
      }
    } else {
      // swiped to right
      if (translationX < rightThreshold) {
        toValue = -rightWidth;
      }
    }

    this._animateRow(startOffsetX, toValue, velocityX);
  };

  _animateRow = (fromValue, toValue, velocityX) => {
    const { dragX, rowTranslation } = this.state;
    dragX.setValue(0);
    rowTranslation.setValue(fromValue);

    this.setState({ rowState: Math.sign(toValue) });
    Animated.spring(rowTranslation, {
      velocity: velocityX,
      bounciness: 0,
      toValue,
      useNativeDriver: this.props.useNativeAnimations,
    }).start();
  };

  _onRowLayout = ({ nativeEvent }) => {
    this.setState({ rowWidth: nativeEvent.layout.width });
  };

  _currentOffset = () => {
    const { leftWidth, rowWidth, rightOffset, rowState } = this.state;
    const rightWidth = rowWidth - rightOffset;
    if (rowState === 1) {
      return leftWidth;
    } else if (rowState === -1) {
      return -rightWidth;
    }
    return 0;
  };

  close = () => {
    this._animateRow(this._currentOffset(), 0);
  };

  render() {
    const { rowState } = this.state;
    const { children, renderLeftActions, renderRightActions } = this.props;

    const left = renderLeftActions && (
      <Animated.View
        pointerEvents={rowState === 1 ? 'auto' : 'none'}
        style={[styles.leftActions, { opacity: this._leftActionOpacity }]}>
        {renderLeftActions(this._showLeftAction, this._transX)}
        <View
          onLayout={({ nativeEvent }) =>
            this.setState({ leftWidth: nativeEvent.layout.x })}
        />
      </Animated.View>
    );

    const right = renderRightActions && (
      <Animated.View
        pointerEvents={rowState === -1 ? 'auto' : 'none'}
        style={[styles.rightActions, { opacity: this._rightActionOpacity }]}>
        {renderRightActions(this._showRightAction, this._transX)}
        <View
          onLayout={({ nativeEvent }) =>
            this.setState({ rightOffset: nativeEvent.layout.x })}
        />
      </Animated.View>
    );

    return (
      <PanGestureHandler
        {...this.props}
        minDeltaX={10}
        onGestureEvent={this._onGestureEvent}
        onHandlerStateChange={this._onHandlerStateChange}>
        <Animated.View onLayout={this._onRowLayout}>
          {left}
          {right}
          <TapGestureHandler
            enabled={rowState !== 0}
            onHandlerStateChange={this._onTapHandlerStateChange}>
            <Animated.View
              pointerEvents={rowState === 0 ? 'auto' : 'box-only'}
              style={{
                overflow: 'hidden',
                transform: [{ translateX: this._transX }],
              }}>
              {children}
            </Animated.View>
          </TapGestureHandler>
        </Animated.View>
      </PanGestureHandler>
    );
  }
}

const styles = StyleSheet.create({
  leftActions: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
  },
  rightActions: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row-reverse',
  },
});

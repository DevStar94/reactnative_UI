import React from 'react';
import { Text, View, Button, FlatList, StyleSheet } from 'react-native';
import { StackNavigator } from 'react-navigation';
import { RectButton, ScrollView } from 'react-native-gesture-handler';

import Swipeable from './swipeable';
import Draggable from './draggable';
import PagerAndDrawer from './pagerAndDrawer';
import PanResponder from './panResponder';
import Bouncing from './bouncing';
import ChatHeads from './chatHeads';
import Combo from './combo';

const SCREENS = {
  Swipeable: { screen: Swipeable, title: 'Swipeable rows & buttons' },
  Draggable: { screen: Draggable },
  PagerAndDrawer: { screen: PagerAndDrawer, title: 'Android pager & drawer' },
  PanResponder: { screen: PanResponder },
  Bouncing: { screen: Bouncing, title: 'Twist & bounce back animation' },
  ChatHeads: {
    screen: ChatHeads,
    title: 'Chat Heads (no native animated support yet)',
  },
  Combo: { screen: Combo },
};

class MainScreen extends React.Component {
  static navigationOptions = {
    title: 'Gesture Handler Demo',
  };
  _onPressItem = item => this.props.navigation.navigate(item);
  _renderItem = props =>
    <MainScreenItem {...props} onPressItem={this._onPressItem} />;
  _renderScroll = props => <ScrollView {...props} />;
  render() {
    const { navigate } = this.props.navigation;
    return (
      <FlatList
        style={styles.list}
        data={Object.keys(SCREENS)}
        ItemSeparatorComponent={ItemSeparator}
        renderItem={this._renderItem}
        renderScrollComponent={this._renderScroll}
      />
    );
  }
}

const ItemSeparator = () => <View style={styles.separator} />;

class MainScreenItem extends React.Component {
  _onPress = () => this.props.onPressItem(this.props.item);
  render() {
    const { item, onPress } = this.props;
    return (
      <RectButton style={styles.button} onPress={this._onPress}>
        <Text style={styles.buttonText}>
          {SCREENS[item].title || item}
        </Text>
      </RectButton>
    );
  }
}

const ExampleApp = StackNavigator({
  Main: { screen: MainScreen },
  ...SCREENS,
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#888',
  },
  list: {
    backgroundColor: '#EFEFF4',
  },
  separator: {
    height: 1,
    backgroundColor: '#DBDBE0',
  },
  buttonText: {
    backgroundColor: 'transparent',
  },
  button: {
    flex: 1,
    height: 60,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});

export default ExampleApp;

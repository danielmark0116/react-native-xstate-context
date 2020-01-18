import React, {useEffect} from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ListView,
  SectionList,
  FlatList,
} from 'react-native';

import {EventObject} from 'xstate';

import {Machine, assign} from 'xstate';

import {useMachine} from '@xstate/react';
import {Button} from 'react-native-paper';

const mockData = [...Array(40)].map((x, index) => `${index + 1}`);

const dataPerFetch = 10;

interface MachineContext {
  data: string[];
}

interface MachineStateSchema {
  states: {
    idle: {};
    fetching: {};
    more: {};
    complete: {};
    fail: {};
  };
}

enum EventTypes {
  FETCH = 'FETCH',
  MORE = 'MORE',
  DONE = 'DONE',
  FAIL = 'FAIL',
}

type EventTypesSchema = EventTypes.FETCH | EventTypes.DONE | EventTypes.FAIL;

interface Events extends EventObject {
  type: EventTypes;
}

const myMachine = Machine<MachineContext, MachineStateSchema, Events>({
  id: 'myMachine',
  initial: 'idle',
  context: {
    data: [],
  },
  states: {
    idle: {
      invoke: {
        id: 'init-fetch',
        src: () => cb => cb(EventTypes.FETCH),
      },
      on: {
        [EventTypes.FETCH]: {
          target: 'fetching',
        },
      },
    },
    fetching: {
      on: {
        [EventTypes.MORE]: {
          target: 'more',
          actions: assign({
            data: ({data}, event: any) => [...data, ...event.newData],
          }),
        },
      },
      invoke: {
        src: (context: MachineContext, _e: any) => {
          const {data} = context;

          return async (cb: any, _onEvent: any) => {
            await new Promise((res, rej) => setTimeout(res, 500));

            const newData = mockData.slice(
              data.length,
              data.length + dataPerFetch,
            );

            // this callback can be replaced with onDone
            cb({type: EventTypes.MORE, newData});
          };
        },
        // if callback is used in invoke key then the onDone is skipped
        onDone: {actions: () => console.log('done fetching from onDone')},
        onError: {actions: () => console.log('error occured')},
      },
    },
    more: {
      on: {
        [EventTypes.FETCH]: {target: 'fetching'},
      },
    },
    complete: {type: 'final'},
    fail: {type: 'final'},
  },
});

const App = () => {
  const [curState, send] = useMachine(myMachine);

  const data = curState.context.data;

  return (
    <SafeAreaView style={styles.center}>
      <Text style={styles.title}>State Machine</Text>
      <TouchableOpacity
        onPress={() => {
          send(EventTypes.FETCH);
        }}>
        <Text>Start machine</Text>
      </TouchableOpacity>
      <Button
        onPress={() => {
          send(EventTypes.DONE);
        }}>
        <Text>Complete machine</Text>
      </Button>
      <Text style={{marginBottom: 30}}>{curState.value}</Text>
      <FlatList
        data={data}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({item}) => (
          <Text style={{height: 200, backgroundColor: 'grey', margin: 10}}>
            {item}
          </Text>
        )}
        onEndReachedThreshold={0.25}
        onEndReached={() => send(EventTypes.FETCH)}
        // keyExtractor={(item: any, index: any) => index}
        // renderItem={({item}) => <Text>{item}</Text>}
      />
    </SafeAreaView>
  );
};
export default App;

const styles = StyleSheet.create({
  center: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    marginBottom: 20,
  },
});

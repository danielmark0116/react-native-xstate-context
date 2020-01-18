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
import {Button, ActivityIndicator, Colors} from 'react-native-paper';

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
  RESET = 'RESET',
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
        [EventTypes.DONE]: {
          target: 'complete',
          actions: assign({
            data: ({data}, event: any) => [...data, ...event.newData],
          }),
        },
        [EventTypes.RESET]: {
          target: 'idle',
          actions: assign({data: (data, event) => []}),
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

            const isThereMore =
              mockData.length > context.data.length + newData.length;

            // this callback can be replaced with onDone

            // throw new Error();

            if (isThereMore) {
              cb({type: EventTypes.MORE, newData});
            } else {
              cb({type: EventTypes.DONE, newData});
            }
          };
        },
        // if callback is used in invoke key then the onDone is skipped
        onDone: {actions: () => console.log('done fetching from onDone')},
        onError: {target: 'fail'},
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

      {curState.matches('fail') && <Text>Wyjebalo error</Text>}

      <FlatList
        data={data}
        keyExtractor={(item, index) => index.toString()}
        onRefresh={() => console.log('reset')}
        refreshing={true}
        renderItem={({item}) => (
          <Text
            style={{
              height: 100,
              backgroundColor: Colors.amber200,
              margin: 10,
              padding: 20,
            }}>
            {item}
          </Text>
        )}
        onEndReachedThreshold={0}
        onEndReached={() => curState.matches('more') && send(EventTypes.FETCH)}
        ListFooterComponent={
          <>
            {curState.matches('fetching') && (
              <ActivityIndicator animating color={Colors.green700} />
            )}
            {curState.matches('complete') && (
              <Text style={{textAlign: 'center', marginBottom: 20}}>
                No more content to load
              </Text>
            )}
          </>
        }
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

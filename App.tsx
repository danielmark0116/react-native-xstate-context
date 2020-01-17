import React, {useEffect} from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
} from 'react-native';

import {EventObject} from 'xstate';

import {Machine, assign} from 'xstate';

import {useMachine} from '@xstate/react';

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
          actions: (s: any, event: any) => console.log(s, event),
        },
      },
      invoke: {
        src: (context: any, _e: any) => {
          // console.log(context);

          return async (cb: any, _onEvent: any) => {
            await new Promise((res, rej) => setTimeout(rej, 1000));

            // this callback can be replaced with onDone
            cb({type: EventTypes.MORE, toAdd: ['lasd']});
          };
        },
        // if callback is used in invoke key then the onDone is skipped
        onDone: {actions: () => console.log('done fetching from onDone')},
        onError: {actions: () => console.log('error occured')},
      },
    },
    more: {
      // onEntry: (cxt: any) => console.log(cxt),
    },
    complete: {type: 'final'},
    fail: {type: 'final'},
  },
});

const App = () => {
  const [curState, send] = useMachine(myMachine);

  return (
    <SafeAreaView style={styles.center}>
      <Text style={styles.title}>State Machine</Text>
      <TouchableOpacity
        onPress={() => {
          send(EventTypes.FETCH);
        }}>
        <Text>Start machine</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => {
          send(EventTypes.DONE);
        }}>
        <Text>Complete machine</Text>
      </TouchableOpacity>
      <Text>{curState.value}</Text>
    </SafeAreaView>
  );
};
export default App;

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    marginBottom: 20,
  },
});

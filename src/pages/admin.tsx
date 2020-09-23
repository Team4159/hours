import React, { useMemo, useState } from 'react';

import {
  Button,
  Flex,
  FlexProps,
  Heading,
  Icon,
  Input,
  Stack,
  Text,
  useToast
} from '@chakra-ui/core';

import { action, observable } from 'mobx';
import { useObserver } from 'mobx-react';
import { getUsers } from '@/utils/dynamodb';
import UserStore from '@/stores/UserStore';

import moment from 'moment';
import 'moment-duration-format';

import User from '@/models/User';
import Session from '@/models/Session';

type SessionWithUser = Session & { user: User };

const SessionRow: React.FC<FlexProps & { session: SessionWithUser }> = ({ session, ...props }) => {
  const [editable, setEditable] = useState(false);
  const [correctedHours, setCorrectedHours] = useState('');
  const [correctedMinutes, setCorrectedMinutes] = useState('');

  const toast = useToast();

  return useObserver(() => (
    <Flex direction='row' alignItems='center' {...props}>
      <Text flexBasis='20%' paddingX={6} paddingY={3}>
        {session.user.name}
      </Text>
      <Text flexBasis='40%' paddingX={6} paddingY={3}>
        {session.did}
      </Text>
      <Text flexBasis='10%' paddingX={6} paddingY={3}>
        {session.date.clone().subtract(session.time).format('LT')}
      </Text>
      <Text flexBasis='10%' paddingX={6} paddingY={3}>
        {editable ? (
          <Flex direction='row' alignItems='center'>
            <Input
              variant='flushed'
              width={8}
              height='auto'
              placeholder='HH'
              value={correctedHours}
              onChange={e => setCorrectedHours(e.target.value)}
            />
            <Text>:</Text>
            <Input
              variant='flushed'
              width={8}
              height='auto'
              placeholder='MM'
              value={correctedMinutes}
              onChange={e => setCorrectedMinutes(e.target.value)}
            />
          </Flex>
        ) : (
          session.time.format('hh:mm:ss', {
            minValue: 0,
            trim: false
          })
        )}
      </Text>
      <Stack isInline flexBasis='20%' paddingX={6} paddingY={3}>
        {session.flagged ? (
          <Button
            variantColor='green'
            onClick={() => {
              session.flagged = false;
              fetch(`/api/unflagSession?password=${session.user.password}&sessionEnd=${session.date.unix()}`)
                .then(async res => {
                  if (res.status == 400) {
                    throw new Error(await res.text());
                  }
                  toast({
                    title: 'Unflagged Session.',
                    description: 'You\'ve successfully unflagged the session.',
                    status: 'success',
                    duration: 2500
                  });
                })
                .catch(err => {
                  toast({
                    title: 'Failed to Unflag Session.',
                    description: err.toString(),
                    status: 'error',
                    duration: 2500
                  });
                });
            } }
          >
            Unflag
          </Button>
        ) : (
          <Button
            variantColor='red'
            onClick={() => {
              session.flagged = true;
              fetch(`/api/flagSession?password=${session.user.password}&sessionEnd=${session.date.unix()}`)
                .then(async res => {
                  if (res.status == 400) {
                    throw new Error(await res.text());
                  }
                  toast({
                    title: 'Flagged Session.',
                    description: 'You\'ve successfully flagged the session.',
                    status: 'success',
                    duration: 2500
                  });
                })
                .catch(err => {
                  toast({
                    title: 'Failed to Flag Session.',
                    description: err.toString(),
                    status: 'error',
                    duration: 2500
                  });
                });
            }}
          >
            Flag
          </Button>
        )}
        {editable ? (
          <Button
            variantColor='green'
            isDisabled={isNaN(+correctedHours) || isNaN(+correctedMinutes) || correctedHours == '' || correctedMinutes == ''}
            onClick={action(() => {
              setEditable(false);
              const originalSessionEnd = session.date.unix();
              const sessionMinutes = +correctedHours * 60 + +correctedMinutes;
              session.date.subtract(session.time);
              session.time = moment.duration(sessionMinutes, 'minutes');
              session.date.add(session.time);
              fetch(`/api/changeSessionTime?password=${session.user.password}&sessionEnd=${originalSessionEnd}&sessionTime=${session.time.as('seconds')}`)
                .then(async res => {
                  if (res.status == 400) {
                    throw new Error(await res.text());
                  }
                  toast({
                    title: 'Changed Session Time.',
                    description: 'You\'ve successfully changed the time of the session.',
                    status: 'success',
                    duration: 2500
                  });
                })
                .catch(err => {
                  toast({
                    title: 'Failed to Change Session Time.',
                    description: err.toString(),
                    status: 'error',
                    duration: 2500
                  });
                });
            })}
          >
            Save Time
          </Button>
        ) : (
          <Button
            variantColor='yellow'
            onClick={() => setEditable(true)}
          >
            Edit Time
          </Button>
        )}
      </Stack>
    </Flex>
  ));
};

const AdminPage: React.FC<{ users: { [key: string]: any }[] }> = ({ users }) => {
  const [selectedDate, setSelectedDate] = useState(moment());
  const selectedToday = selectedDate.isSame(moment(), 'day');

  const [hydratedUsers] = useState<User[]>(() => observable(users.map(UserStore.hydrateData)));

  const sessions = useMemo<SessionWithUser[]>(() => hydratedUsers.reduce((sessions, user) => {
    return sessions.concat(user.sessions.map(session => {
      // @ts-ignore
      session.user = user;
      return session;
    }));
  }, []).sort((a, b) => a.date.clone().subtract(a.time).diff(b.date.clone().subtract(b.time))), [hydratedUsers]);
  const selectedSessions = useMemo<SessionWithUser[]>(() =>
    sessions.filter(session => session.date.clone().subtract(session.time).isSame(selectedDate, 'day')),
  [sessions, selectedDate]);

  return (
    <Flex direction='column'>
      <Stack direction='row' alignItems='center' justifyContent='center' paddingY={6}>
        <Icon
          size='36px'
          name='chevron-left'
          cursor={selectedToday ? 'default' : 'pointer'}
          color={selectedToday ? 'gray.200' : 'black'}
          onClick={() => !selectedToday && setSelectedDate(selectedDate.clone().add(1, 'day'))}
        />
        <Heading fontSize='2xl'>{selectedDate.format('MMMM Do YYYY')}</Heading>
        <Icon
          size='36px'
          name='chevron-right'
          cursor='pointer'
          onClick={() => setSelectedDate(selectedDate.clone().subtract(1, 'day'))}
        />
      </Stack>
      <Flex direction='row' backgroundColor='gray.300' fontWeight='bold'>
        <Text flexBasis='20%' paddingX={6} paddingY={3}>
          Name
        </Text>
        <Text flexBasis='40%' paddingX={6} paddingY={3}>
          Did
        </Text>
        <Text flexBasis='10%' paddingX={6} paddingY={3}>
          Start
        </Text>
        <Text flexBasis='10%' paddingX={6} paddingY={3}>
          Length
        </Text>
        <Text flexBasis='20%' paddingX={6} paddingY={3}>
          Action
        </Text>
      </Flex>
      {
        selectedSessions.map((session, idx) => (
          <SessionRow
            key={idx}
            session={session}
            backgroundColor={session.flagged ? 'red.300' : idx % 2 == 0 ? 'gray.100' : 'white'}
          />
        )) 
      }
    </Flex>
  );
};

export default AdminPage;

export const getServerSideProps = async () => {
  return {
    props: {
      users: await getUsers()
    }
  };
}

import React, { useMemo, useState } from 'react';

import { Button, Flex, Heading, Icon, Stack, Text, useToast } from '@chakra-ui/core';

import { getUsers } from '@/utils/dynamodb';
import UserStore from '@/stores/UserStore';

import moment from 'moment';
import 'moment-duration-format';

import User from '@/models/User';
import Session from '@/models/Session';

type SessionWithUser = Session & { user: User };

const AdminPage: React.FC<{ users: { [key: string]: any }[] }> = ({ users }) => {
  const [selectedDate, setSelectedDate] = useState(moment());
  const selectedToday = selectedDate.isSame(moment(), 'day');

  const [hydratedUsers, setHydratedUsers] = useState<User[]>(() => users.map(UserStore.hydrateData));
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

  const toast = useToast();

  const updateUserSessions = (user: User, session: SessionWithUser, update: Partial<Session>) => {
    const userIdx = hydratedUsers.findIndex(user_ => user_ == user);
    const sessionIdx = user.sessions.findIndex(session_ => session_ == session);
    setHydratedUsers([
      ...hydratedUsers.slice(0, userIdx),
      {
        ...user,
        sessions: [
          ...user.sessions.slice(0, sessionIdx),
          {
            ...session,
            ...update
          },
          ...user.sessions.slice(sessionIdx + 1, user.sessions.length)
        ]
      },
      ...hydratedUsers.slice(userIdx + 1, hydratedUsers.length),
    ]);
  };

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
          <Flex key={idx} direction='row' backgroundColor={session.flagged ? 'red.300' : idx % 2 == 0 ? 'gray.100' : 'white'}>
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
              {session.time.format('hh:mm:ss', {
                minValue: 0,
                trim: false
              })}
            </Text>
            <Stack isInline flexBasis='20%' paddingX={6} paddingY={3}>
              {session.flagged ? (
                <Button
                  variantColor='green'
                  onClick={() => {
                    updateUserSessions(session.user, session, {
                      flagged: false
                    });
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
                    updateUserSessions(session.user, session, {
                      flagged: true
                    });
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
              <Button variantColor='yellow'>
                Edit Time
              </Button>
            </Stack>
          </Flex>
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

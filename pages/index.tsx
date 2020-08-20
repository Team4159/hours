import React, { useEffect, useState } from 'react';

import {
  Box,
  Button,
  Flex,
  Heading,
  Image,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  PseudoBox,
  Stack,
  Stat,
  StatHelpText,
  StatLabel,
  Text,
  Textarea,
  StatNumber
} from '@chakra-ui/core';

import moment from 'moment';
import 'moment-timezone';

moment.tz.setDefault('Atlantic/Azores');

type User = {
  name: string;
  password: string;
  signedIn: boolean;
  lastSignedIn: moment.Moment;
  totalTime: moment.Duration;
};

const getUserData = (password: string): Promise<Array<string>> => {
  return fetch('/api/src/endpoints/getuserdata.php?' + new URLSearchParams({
    password
  }))
    .then(res => res.json());
}

const signInOut = (password: string): Promise<string> => {
  return fetch('/api/src/endpoints/signin.php?' + new URLSearchParams({
    password
  }))
    .then(res => res.text());
}

const arrayToUser = (array: Array<string>): User => ({
  name: array[0],
  password: array[1],
  signedIn: array[2] == 'TRUE',
  lastSignedIn: moment.unix(parseInt(array[3])),
  totalTime: moment.duration(array[4], 'seconds')
});

const formatDuration = (duration: moment.Duration): string => duration.seconds() > 0 ? moment.utc(duration.asMilliseconds()).format('HH:mm:ss') : '00:00:00';

export default function HomePage() {
  const [userData, setUserData] = useState<User>(null);
  const [currentTime, setCurrentTime] = useState(moment());

  const [password, setPassword] = useState('');
  const [writeUp, setWriteUp] = useState('');

  const [modalShown, setModalShown] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const storedPassword = localStorage.getItem('password');
    if (storedPassword) {
      getUserData(storedPassword)
        .then(json => {
          if (json != null) {
            setUserData(arrayToUser(json));
          }
        });
    }
  }, []);
  useEffect(() => {
    if (userData && userData.signedIn) {
      const interval = setInterval(() => {
        setCurrentTime(moment());
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [userData && userData.signedIn]);

  return (
    <Stack height='100%' alignItems='center' spacing={5}>
      <Flex
        direction='row'
        alignSelf='stretch'
        justifyContent='center'
        backgroundColor='cardinalbotics.red.400'
        paddingY={3}
      >
        <Image src='/logo.png'/>
      </Flex>
      <Box flexGrow={1}/>
      <Heading fontSize='4xl' color='cardinalbotics.red.400'>Hour Tracker</Heading>
      <Stack alignItems='start' width={['80%', '65%', '50%']}>
        {
          !userData ? (
            <Box width='100%'>
              <Input
                isFullWidth
                variant='filled'
                placeholder='Password'
                value={password}
                onChange={e => setPassword(e.target.value)}
                paddingY={6}
              />
            </Box>
          ) : (
            <Stack width='100%'>
              <Heading fontSize='3xl' color={userData.signedIn ? 'green.400' : 'red.400'}>
                {!userData.signedIn && 'Not '}Signed In
              </Heading>
              <Stack isInline>
                <Stat>
                  <StatLabel>Name</StatLabel>
                  <StatNumber>{userData.name}</StatNumber>
                </Stat>
                <Stat>
                  <StatLabel>Password</StatLabel>
                  <PseudoBox
                    backgroundColor='black'
                    _hover={{backgroundColor: 'transparent'}}
                    userSelect='none'
                    cursor='pointer'
                    transition='0.3s all'
                  >
                    <StatNumber>{userData.password}</StatNumber>
                  </PseudoBox>
                </Stat>
              </Stack>
              <Stat>
                <StatLabel>
                  {userData.signedIn ? 'Session' : 'Total'} Time
                </StatLabel>
                <StatNumber>
                  {formatDuration(userData.signedIn ? moment.duration(currentTime.diff(userData.lastSignedIn)) : userData.totalTime)}
                </StatNumber>
                <StatHelpText>
                  {userData.signedIn ?
                    `Total Time: ${formatDuration(userData.totalTime)}` :
                    'Make sure to sign in if you\'re doing work!'}
                </StatHelpText>
              </Stat>
            </Stack>
          )
        }
        { errorMessage && <Text color='red.400'>{errorMessage}</Text> }
        <Stack isInline>
          { !userData || !userData.signedIn ? (
            <Button
              variant='outline'
              variantColor='cardinalbotics.red'
              onClick={() => {
                const passwordToUse = userData ? userData.password : password;  
                getUserData(passwordToUse)
                  .then(json => {
                    if (json != null) {
                      setErrorMessage('');
                      localStorage.setItem('password', passwordToUse)
                      const user = arrayToUser(json);
                      if (!user.signedIn) {
                        signInOut(passwordToUse)
                          .then(() => getUserData(passwordToUse))
                          .then(json => setUserData(arrayToUser(json)))
                          .catch(err => setErrorMessage(err.toString()));
                      }
                    } else {
                      setErrorMessage('Unable to find any matching accounts');
                    }
                  })
                  .catch(err => setErrorMessage(err.toString()));
              }}
            >
              Sign In
            </Button>
          ) : (
            <Button
              variant='outline'
              variantColor='cardinalbotics.red'
              onClick={() => {
                setModalShown(true);
              }}
            >
              Sign Out
            </Button>
          ) }
          { userData && !userData.signedIn && (
            <Button
              variant='solid'
              variantColor='cardinalbotics.red'
              onClick={() => {
                const storedPassword = userData.password;
                setErrorMessage('');
                if (userData.signedIn) {
                  signInOut(storedPassword)
                    .catch(err => setErrorMessage(err.toString()));
                }
                localStorage.removeItem('password');
                setUserData(null);
              }}
            >
              Forget Password
            </Button>
          ) }
        </Stack>
      </Stack>
      <Box flexGrow={6}/>
      <Modal
        isCentered
        isOpen={modalShown}
        onClose={() => setModalShown(false)}
      >
        <ModalOverlay/>
        <ModalContent rounded='md'>
          <ModalHeader>
            <Text>Write-Up</Text>
          </ModalHeader>
          <ModalCloseButton/>
          <ModalBody>
            <Stack alignItems='start'>
              <Textarea
                placeholder='Write about what you did today...'
                fontFamily='body'
                value={writeUp}
                onChange={e => setWriteUp(e.target.value)}
              />
              <Button
                variant='solid'
                variantColor='cardinalbotics.red'
                isDisabled={!writeUp}
                onClick={() => {
                  const storedPassword = userData.password;
                  setErrorMessage('');
                  signInOut(storedPassword)
                    .then(() => getUserData(storedPassword))
                    .then(json => setUserData(arrayToUser(json)))
                    .catch(err => setErrorMessage(err.toString()));
                  setWriteUp('');
                  setModalShown(false);
                }}
              >
                Submit
              </Button>
            </Stack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Stack>
  );
}

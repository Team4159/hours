import React, { useContext, useEffect, useState, useRef } from 'react';

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

import { action } from 'mobx';
import { useObserver } from 'mobx-react';
import { UserContext } from '@/stores/UserStore';

import moment from 'moment';
import 'moment-timezone';
import 'moment-duration-format';

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

const Onboarding = () => {
  const userStore = useContext(UserContext);
  
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setLoading] = useState(false);

  return (
    <Stack
      as='form'
      width='100%'
      onSubmit={e => {
        e.preventDefault();
        setErrorMessage('');
        setLoading(true);
        userStore.fetchUserData(password)
          .then(action(user => {
            userStore.password = password;
            if (!user.signedIn) {
              return userStore.signInOut();
            }
          }))
          .catch(err => setErrorMessage(err.toString()))
          .finally(() => setLoading(false));
      }}
      alignItems='start'
    >
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
      {errorMessage && <Text color='red.400'>{errorMessage}</Text>}
      <Button
        variant='outline'
        variantColor='cardinalbotics.red'
        type='submit'
        isDisabled={isLoading}
      >
        {isLoading ? 'Loading...' : 'Sign In'}
      </Button>
    </Stack>
  );
}

const Timer: React.FC<{ since: moment.Moment }> = ({ since }) => {

}

const Account = () => {
  const userStore = useContext(UserContext);

  return useObserver(() => (
    <Stack width='100%'>
      <Heading fontSize='3xl' color={userStore.userData.signedIn ? 'green.400' : 'red.400'}>
        {!userStore.userData.signedIn && 'Not '}Signed In
      </Heading>
      <Stack isInline>
        <Stat>
          <StatLabel>Name</StatLabel>
          <StatNumber>{userStore.userData.name}</StatNumber>
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
            <StatNumber>{userStore.userData.password}</StatNumber>
          </PseudoBox>
        </Stat>
      </Stack>
      <Stat>
        <StatLabel>
          {userStore.userData.signedIn ? 'Session' : 'Total'} Time
        </StatLabel>
        <StatNumber>
          {/*{(userStore.userData.signedIn ? moment.duration(Math.max(currentTime.diff(userStore.userData.lastSignedIn), 0)) : userStore.userData.totalTime).format('hh:mm:ss', {
            minValue: 0,
            trim: false
          })}*/}
        </StatNumber>
        <StatHelpText>
          {userStore.userData.signedIn ?
            `Total Time: ${userStore.userData.totalTime.format('hh:mm:ss', { trim: false })}` :
            'Make sure to sign in if you\'re doing work!'}
        </StatHelpText>
      </Stat>
    </Stack>
  ));
}

const HomePage = () => {
  const userStore = useContext(UserContext);

  const [currentTime, setCurrentTime] = useState(moment());

  const [writeUp, setWriteUp] = useState('');

  const [modalShown, setModalShown] = useState(false);
  const [modalErrorMessage, setModalErrorMessage] = useState('');

  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  return useObserver(() => (
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
        { !userStore.userData ? <Onboarding/> : <Account/> }
        {/*
        <Stack isInline>
          { !userStore.userData || !userStore.userData.signedIn ? (
            <Button
              variant='outline'
              variantColor='cardinalbotics.red'
              onClick={action(() => {
                if (!userStore.userData) {
                  userStore.password = password;
                }
                getUserData(passwordToUse)
                  .then(json => {
                    if (json != null) {
                      setErrorMessage('');
                      localStorage.setItem('password', passwordToUse)
                      const user = arrayToUser(json);
                      if (!user.signedIn) {
                        signInOut(passwordToUse)
                          .then(userStore.refreshUserData)
                          .catch(err => setErrorMessage(err.toString()))
                          .finally(callback);
                      } else {
                        callback();
                      }
                    } else {
                      setErrorMessage('Unable to find any matching accounts');
                      callback();
                    }
                  })
                  .catch(err => {
                    setErrorMessage(err.toString());
                    callback();
                  });
              })}
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
          { userStore.userData && !userStore.userData.signedIn && (
            <Button
              variant='solid'
              variantColor='cardinalbotics.red'
              onClick={() => {
                const storedPassword = userStore.userData.password;
                setErrorMessage('');
                if (userStore.userData.signedIn) {
                  signInOut(storedPassword)
                    .catch(err => setErrorMessage(err.toString()));
                }
                localStorage.removeItem('password');
              }}
            >
              Forget Password
            </Button>
          ) }
        </Stack>
        */}
      </Stack>
      <Box flexGrow={6}/>
      <Modal
        isCentered
        isOpen={modalShown}
        initialFocusRef={textAreaRef}
        onClose={(_, reason) => {
          if (reason != 'clickedOverlay') {
            setModalShown(false);
          }
        }}
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
                ref={ref => textAreaRef.current = ref}
              />
              { modalErrorMessage && <Text color='red.400'>{modalErrorMessage}</Text> }
              <Button
                variant='solid'
                variantColor='cardinalbotics.red'
                isDisabled={!writeUp}
                onClick={() => {
                  const storedPassword = userStore.userData.password;
                  setModalErrorMessage('');
                  signInOut(storedPassword)
                    .then(() => getUserData(storedPassword))
                    .then(json => {
                      setWriteUp('');
                      setModalShown(false);
                    })
                    .catch(err => setModalErrorMessage(err.toString()))
                }}
              >
                Submit
              </Button>
            </Stack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Stack>
  ));
}

export default HomePage;

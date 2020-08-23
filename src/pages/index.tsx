import React, { useContext, useEffect, useState, useRef } from 'react';

import {
  Box,
  Button,
  Flex,
  Heading,
  IconButton,
  Image,
  Input,
  Modal,
  IModal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Stack,
  Stat,
  StatHelpText,
  StatLabel,
  StatNumber,
  Text,
  Textarea,
  useToast
} from '@chakra-ui/core';

import { action } from 'mobx';
import { useObserver, observer } from 'mobx-react';
import { UserContext } from '@/stores/UserStore';

import moment from 'moment';
import 'moment-timezone';
import 'moment-duration-format';

moment.tz.setDefault('Atlantic/Azores');

const HELP_TEXT = 'If this error was unexpected, contact Kai or Ling on Slack.';

const Onboarding = () => {
  const userStore = useContext(UserContext);
  
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setLoading] = useState(false);

  const toast = useToast();

  return (
    <Stack
      as='form'
      width='100%'
      onSubmit={e => {
        e.preventDefault();
        setErrorMessage('');
        setLoading(true);
        userStore.password = password;
        userStore.fetchUserData(false)
          .then(user => {
            if (!user.signedIn) {
              return userStore.signIn();
            } else {
              userStore.userData = user;
            }
          })
          .then(() => toast({
            title: 'Signed in.',
            description: 'You\'ve  successfully been signed in and your password has been remembered.',
            status: 'success'
          }))
          .catch(err => {
            setErrorMessage(err.toString());
            userStore.password = null;
          })
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
      {errorMessage && (
        <Text color='red.400'>
          {errorMessage}<br/>
          {HELP_TEXT}
        </Text>
      )}
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

const SignOutModal: React.FC<Omit<IModal, 'children'>> = ({ onClose, ...props }) => {
  const userStore = useContext(UserContext);

  const [isModalLoading, setModalLoading] = useState(false);
  const [writeUp, setWriteUp] = useState('');
  const [modalErrorMessage, setModalErrorMessage] = useState('');

  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const toast = useToast();

  return useObserver(() => (
    <Modal
      {...props}
      onClose={onClose}
      isCentered
      initialFocusRef={textAreaRef}
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
              isDisabled={!writeUp || isModalLoading}
              onClick={() => {
                setModalErrorMessage('');
                setModalLoading(true);
                userStore.signOut(writeUp)
                  .then(() => {
                    setWriteUp('');
                    onClose(null);
                    toast({
                      title: 'Signed out.',
                      description: 'You\'ve successfully been signed out and your session has been saved.',
                      status: 'success'
                    });
                  })
                  .catch(err => setModalErrorMessage(err.toString()))
                  .finally(() => setModalLoading(false));
              }}
            >
              {isModalLoading ? 'Loading...' : 'Submit'}
            </Button>
          </Stack>
        </ModalBody>
      </ModalContent>
    </Modal>
  ));
}

const Account = observer(() => {
  const userStore = useContext(UserContext);

  const [currentTime, setCurrentTime] = useState(moment());

  const [isModalOpen, setModalOpen] = useState(false);
  const [isLoading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [isChangingPassword, setChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  const toast = useToast();

  useEffect(() => {
    if (userStore.userData.signedIn) {
      const interval = setInterval(() => {
        setCurrentTime(moment());
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [userStore.userData.signedIn]);

  return (
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
          <Stack isInline alignItems='center'>
            {isChangingPassword ? (
              <Input
                size='sm'
                height='30px'
                variant='flushed'
                _focus={{ borderBottomColor: 'cardinalbotics.red.400' }}
                fontFamily='body'
                fontSize='xl'
                fontWeight='bold'
                placeholder='New Password'
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
              />
            ): (
              <StatNumber>
                {userStore.userData.password}
              </StatNumber>
            )}
            <IconButton
              size='xs'
              variant='outline'
              variantColor='cardinalbotics.red'
              aria-label={isChangingPassword ? 'Check' : 'Edit'}
              icon={isChangingPassword ? 'check' : 'edit'}
              onClick={() => {
                if (isChangingPassword) {
                  toast({
                    title: 'Password changed.',
                    description: 'You\'ve successfully changed your password.',
                    status: 'success'
                  });
                }
                setChangingPassword(!isChangingPassword);
              }}
            />
          </Stack>
        </Stat>
      </Stack>
      <Stat>
        <StatLabel>
          {userStore.userData.signedIn ? 'Session' : 'Total'} Time
        </StatLabel>
        <StatNumber>
          {
            (
              userStore.userData.signedIn ?
              moment.duration(Math.max(currentTime.diff(userStore.userData.lastTime), 0)) :
              userStore.userData.totalTime
            ).format('hh:mm:ss', {
              minValue: 0,
              trim: false
            })
          }
        </StatNumber>
        <StatHelpText>
          {userStore.userData.signedIn ?
            `Total Time: ${userStore.userData.totalTime.format('hh:mm:ss', { trim: false })}` :
            'Make sure to sign in if you\'re doing work!'}
        </StatHelpText>
      </Stat>
      {errorMessage && (
        <Text color='red.400'>
          {errorMessage}<br/>
          {HELP_TEXT}
        </Text>
      )}
      <Stack isInline>
        <Button
          variant='outline'
          variantColor='cardinalbotics.red'
          isDisabled={isLoading}
          onClick={() => {
            setErrorMessage('');
            setLoading(true);
            if (!userStore.userData.signedIn) {
              userStore.signIn()
                .then(() => toast({
                  title: 'Signed in.',
                  description: 'You\'ve successfully been signed in.',
                  status: 'success'
                }))
                .catch(err => setErrorMessage(err.toString()))
                .finally(() => setLoading(false));
            } else {
              setModalOpen(true);
            }
          }}
        >
          {isLoading ? 'Loading...' : (userStore.userData.signedIn ? 'Sign Out' : 'Sign In')}
        </Button>
        { !userStore.userData.signedIn && (
          <Button
            variant='solid'
            variantColor='cardinalbotics.red'
            isDisabled={isLoading}
            onClick={action(() => {
              setErrorMessage('');
              userStore.forgetPassword();
              toast({
                title: 'Password forgotten.',
                description: 'You\'ve successfully forgotten your password and you will no longer be automatically signed in.',
                status: 'success'
              });
            })}
          >
            Forget Password
          </Button>
        ) }
      </Stack>
      <SignOutModal
        isOpen={isModalOpen}
        onClose={(_, reason) => {
          if (reason != 'clickedOverlay') {
            setLoading(false);
            setModalOpen(false);
          }
        }}
      />
    </Stack>
  );
});

const HomePage = () => {
  const userStore = useContext(UserContext);

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
      </Stack>
      <Box flexGrow={6}/>
    </Stack>
  ));
}

export default HomePage;

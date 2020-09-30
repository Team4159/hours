import React, { Fragment, useContext, useState, useRef, useEffect } from 'react';

import {
  Box,
  Button,
  Flex,
  FlexProps,
  Heading,
  IconButton,
  Input,
  Link,
  Modal,
  IModal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  PseudoBox,
  Stack,
  StackProps,
  Stat,
  StatHelpText,
  StatLabel,
  StatNumber,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Text,
  Textarea,
  useToast
} from '@chakra-ui/core';

import { action } from 'mobx';
import { useObserver, observer } from 'mobx-react';
import UserStore, { UserContext } from '@/stores/UserStore';
import TimeStore, { TimeContext } from '@/stores/TimeStore';

import moment from 'moment';
import 'moment-timezone';
import 'moment-duration-format';

import Session from '@/models/Session';

const HELP_TEXT = 'If this error was unexpected, fill out our feedback form.';

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
            status: 'success',
            duration: 2500
          }))
          .catch(err => {
            setErrorMessage(err.toString());
            userStore.password = null;
          })
          .finally(() => setLoading(false));
      }}
      alignItems='start'
    >
      <Heading fontSize='4xl' color='cardinalbotics.red.400' alignSelf='center'>
        Team 4159 Hour Tracker
      </Heading>
      <Box width='100%'>
        <Input
          isFullWidth
          variant='filled'
          borderColor='cardinalbotics.red.400'
          backgroundColor='gray.100'
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
  const [correctedHours, setCorrectedHours] = useState('');
  const [correctedMinutes, setCorrectedMinutes] = useState('');
  const [modalErrorMessage, setModalErrorMessage] = useState('');

  useEffect(() => {
    if ((correctedMinutes != '' && isNaN(+correctedMinutes)) || +correctedMinutes < 0) {
      setModalErrorMessage('Corrected minutes is not a positive number');
    } else if ((correctedHours != '' && isNaN(+correctedHours)) || +correctedHours < 0) {
      setModalErrorMessage('Corrected hours is not a positive number');
    } else if ((correctedMinutes != '' || correctedHours != '') && +correctedMinutes == 0 && +correctedHours == 0) {
      setModalErrorMessage('You must enter a non-zero time');
    } else {
      setModalErrorMessage('');
    }
  }, [writeUp, correctedMinutes, correctedHours]);

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
            <Stack backgroundColor='yellow.400' rounded='md' padding={4}>
              <Text fontWeight='bold'>
                Fill this out if you forgot to sign out when you stopped working
              </Text>
              <Stack isInline>
                <Box>
                  <Input
                    placeholder='Correct Hours'
                    value={correctedHours}
                    onChange={e => setCorrectedHours(e.target.value)}
                  />
                </Box>
                <Box>
                  <Input
                    placeholder='Correct Minutes'
                    value={correctedMinutes}
                    onChange={e => setCorrectedMinutes(e.target.value)}
                  />
                </Box>
              </Stack>
            </Stack>
            {modalErrorMessage && <Text color='red.400'>{modalErrorMessage}</Text>}
            <Button
              variant='solid'
              variantColor='cardinalbotics.red'
              isDisabled={
                !writeUp || !!modalErrorMessage || isModalLoading
              }
              onClick={() => {
                setModalErrorMessage('');
                setModalLoading(true);
                userStore.signOut(writeUp, (
                  (correctedMinutes != '' || correctedHours != '') ?
                    ((+correctedHours * 60 + +correctedMinutes) * 60) :
                    null
                ))
                  .then(() => {
                    setWriteUp('');
                    onClose(null);
                    toast({
                      title: 'Signed out.',
                      description: 'You\'ve successfully been signed out and your session has been saved.',
                      status: 'success',
                      duration: 2.5
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

const Account: React.FC<StackProps> = observer(props => {
  const userStore = useContext(UserContext);
  const timeStore = useContext(TimeContext);

  const [isModalOpen, setModalOpen] = useState(false);
  const [isLoading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [isChangingPassword, setChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  const toast = useToast();

  return (
    <Stack rounded='lg' padding={6} backgroundColor='white' {...props}>
      <Heading fontSize='4xl' color={userStore.userData.signedIn ? 'green.400' : 'red.400'}>
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
                <PseudoBox
                  backgroundColor='black'
                  cursor='pointer'
                  _hover={{ backgroundColor: 'transparent' }}
                >
                  {userStore.userData.password}
                </PseudoBox>
              </StatNumber>
            )}
            <IconButton
              size='xs'
              variant='outline'
              isDisabled={isChangingPassword && newPassword == ''}
              variantColor='cardinalbotics.red'
              aria-label={isChangingPassword ? 'Check' : 'Edit'}
              icon={isChangingPassword ? 'check' : 'edit'}
              onClick={() => {
                if (isChangingPassword) {
                  userStore
                    .changePassword(newPassword)
                    .then(() => toast({
                      title: 'Password changed.',
                      description: 'You\'ve successfully changed your password.',
                      status: 'success',
                      duration: 2500
                    }))
                    .catch(err => toast({
                      title: 'An error occurred.',
                      description: err.toString(),
                      status: 'error',
                      duration: 2500
                    }))
                    .finally(() => setNewPassword(''));
                }
                setChangingPassword(!isChangingPassword);
              }}
            />
          </Stack>
        </Stat>
      </Stack>
      <Stat flexGrow={0}>
        <StatLabel>
          {userStore.userData.signedIn ? 'Session' : 'Total'} Time
        </StatLabel>
        <StatNumber>
          {
            (
              userStore.userData.signedIn ?
              moment.duration(Math.max(timeStore.currentTime.diff(userStore.userData.lastTime), 0)) :
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
                  status: 'success',
                  duration: 2500
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
        {!userStore.userData.signedIn && (
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
                status: 'success',
                duration: 2500
              });
            })}
          >
            Forget Me
          </Button>
        )}
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

const SessionTableRow: React.FC<FlexProps & { session: Session }> = ({ session, ...props }) => {
  const [isExpanded, setExpanded] = useState(false);

  return (
    <Flex direction='row' {...props}>
      <Text flexBasis='10%' paddingX={6} paddingY={2}>
        {session.date.clone().subtract(session.time).format('MMM Do')}
      </Text>
      <Text flexBasis='20%' paddingX={6} paddingY={3}>
        {session.date.clone().subtract(session.time).format('LT')} - {session.date.format('LT')}
      </Text>
      <Text flexBasis='70%' wordBreak='break-all' paddingX={6} paddingY={2}>
        {session.did.length > 250 ? (
          <Fragment>
            {!isExpanded ? session.did.slice(0, 250).concat('...') : session.did}
            <Text cursor='pointer' color='cardinalbotics.red.400' onClick={() => setExpanded(!isExpanded)}>
              {isExpanded ? 'Collpase' : 'Expand'}
            </Text>
          </Fragment>
        ) : session.did}
        {session.flagged && (
          <Text display='inline' color='red.700' marginLeft={1}>
            (This session has been flagged automatically or by an administrator)
          </Text>
        )}
      </Text>
    </Flex>
  )
}

const SessionsTable: React.FC<FlexProps> = props => {
  const userStore = useContext(UserContext);

  return useObserver(() => (
    <Flex direction='column' {...props}>
      <Flex direction='row' backgroundColor='gray.300' fontWeight='bold'>
        <Text flexBasis='10%' paddingX={6} paddingY={3}>
          Date
        </Text>
        <Text flexBasis='20%' paddingX={6} paddingY={3}>
          Time
        </Text>
        <Text flexBasis='70%' paddingX={6} paddingY={3}>
          What Did You Do?
        </Text>
      </Flex>
      {userStore.userData.sessions.reverse().map((session, idx) => (
        <SessionTableRow
          key={idx}
          session={session}
          backgroundColor={session.flagged ? 'red.300' : idx % 2 == 0 ? 'gray.100' : 'white'}
        />
      ))}
    </Flex>
  ));
}

const OtherUsersTable: React.FC<FlexProps> = props => {
  const userStore = useContext(UserContext);
  const timeStore = useContext(TimeContext);

  return useObserver(() => (
    <Flex direction='column' {...props}>
      <Flex direction='row' backgroundColor='gray.300' fontWeight='bold'>
        <Text flexBasis='33%' paddingX={6} paddingY={3}>
          Name
        </Text>
        <Text flexBasis='33%' paddingX={6} paddingY={3}>
          Time In
        </Text>
        <Text flexBasis='33%' paddingX={6} paddingY={3}>
          Total Time
        </Text>
      </Flex>
      {
        userStore.otherUserData
          .filter(user => user.signedIn && user.name != userStore.userData.name)
          .sort((a, b) => a.lastTime.diff(b.lastTime))
          .map((user, idx) => (
            <Flex key={idx} direction='row' backgroundColor={idx % 2 == 0 ? 'gray.100' : 'white'}>
              <Text flexBasis='33%' paddingX={6} paddingY={2}>
                {user.name}
              </Text>
              <Text flexBasis='33%' paddingX={6} paddingY={3}>
                {
                  moment.duration(timeStore.currentTime.diff(user.lastTime)).format('hh:mm:ss', {
                    minValue: 0,
                    trim: false
                  })
                }
              </Text>
              <Text flexBasis='33%' paddingX={6} paddingY={3}>
                {user.totalTime.format('hh:mm:ss', { trim: false })}
              </Text>
            </Flex>
          ))
      }
    </Flex>
  ));
}

const HomePage: React.FC = () => {
  const userStore = useContext(UserContext);

  return useObserver(() => (
    <Stack minHeight='100%' alignItems='center' spacing={5} backgroundColor='gray.100'>
      <Flex
        direction='row'
        alignSelf='stretch'
        justifyContent='center'
        backgroundColor='cardinalbotics.red.400'
        paddingY={3}
      >
        <svg version="1.0" xmlns="http://www.w3.org/2000/svg" width="188px" height="131px" viewBox="0 0 700.000000 479.000000" preserveAspectRatio="xMidYMid meet">
			    <metadata>
			    Created by potrace 1.12, written by Peter Selinger 2001-2015
			    </metadata>
			    <g transform="translate(0.000000,479.000000) scale(0.100000,-0.100000)" fill="#FFFFFF" stroke="none">
			    <path d="M5832 4652 c-18 -34 -36 -87 -42 -127 -6 -38 -12 -71 -14 -72 -2 -2
			    -14 6 -29 17 -34 27 -40 26 -71 -15 -49 -64 -66 -114 -66 -197 0 -43 -4 -78
			    -8 -78 -5 0 -19 11 -32 25 l-24 25 -24 -22 c-31 -30 -58 -83 -66 -133 -4 -22
			    -16 -73 -28 -113 -20 -69 -20 -76 -6 -122 l16 -48 -34 -59 c-38 -66 -41 -98
			    -17 -168 14 -42 15 -60 5 -135 -17 -128 -15 -152 19 -216 28 -55 30 -61 18
			    -101 -20 -74 -7 -105 87 -198 49 -48 96 -86 112 -89 18 -5 35 -20 50 -47 13
			    -22 21 -43 18 -47 -6 -6 -111 11 -179 29 l-37 10 6 55 7 55 -73 -3 -74 -3 -8
			    -32 c-5 -18 -10 -33 -11 -33 -8 0 -313 106 -444 154 -83 30 -283 101 -445 157
			    -161 56 -354 124 -428 151 -222 82 -360 174 -523 349 -99 106 -99 106 -118 -2
			    -27 -150 8 -259 116 -365 36 -35 61 -64 57 -64 -5 0 -41 11 -81 25 -85 29 -89
			    26 -72 -67 11 -64 36 -109 104 -190 59 -71 51 -78 -86 -78 l-115 0 -11 -44
			    c-22 -90 -29 -85 125 -88 l137 -3 30 -38 31 -38 -18 -87 c-10 -48 -23 -103
			    -30 -122 l-11 -35 -98 -3 -99 -3 7 43 c4 24 16 80 26 126 27 119 31 112 -54
			    112 l-73 0 -43 -196 c-23 -108 -40 -202 -37 -211 9 -23 398 -15 443 10 45 24
			    81 81 94 149 6 32 14 58 18 58 4 0 23 -13 43 -30 l36 -30 -14 -57 c-7 -32 -13
			    -71 -14 -86 l0 -28 72 3 72 3 9 38 c5 20 12 37 16 37 5 0 15 -17 23 -38 11
			    -28 32 -50 88 -87 91 -62 97 -75 36 -75 -24 0 -47 -4 -50 -8 -5 -8 -24 -94
			    -96 -434 -17 -81 -29 -152 -25 -158 3 -5 35 -10 70 -10 74 0 75 1 94 95 28
			    139 91 435 97 457 5 17 8 16 45 -2 23 -12 39 -28 39 -38 0 -9 -18 -102 -40
			    -205 -46 -217 -49 -256 -19 -283 19 -17 41 -19 210 -22 l189 -4 9 25 c5 13 12
			    44 16 69 l7 46 -140 4 c-77 1 -143 5 -145 8 -5 4 42 249 49 258 1 2 26 -10 56
			    -27 30 -17 79 -39 110 -50 30 -10 75 -34 99 -52 24 -19 73 -48 109 -64 60 -28
			    73 -30 178 -30 61 0 112 -1 112 -3 0 -2 -5 -12 -10 -23 -10 -18 -23 -19 -175
			    -19 l-164 0 -12 -54 c-20 -89 -27 -86 193 -86 271 1 285 8 319 180 11 58 18
			    70 63 113 28 26 62 50 76 54 14 3 49 17 79 30 30 13 55 22 56 21 1 -2 -28 -75
			    -66 -163 -37 -88 -87 -210 -109 -270 -38 -101 -48 -118 -113 -188 l-72 -77
			    -172 -7 -172 -6 -11 -51 c-5 -28 -20 -103 -33 -166 l-23 -115 -93 -63 c-51
			    -35 -94 -62 -96 -60 -2 2 14 99 37 215 22 117 38 219 35 228 -6 13 -35 15
			    -210 15 l-204 0 -23 -115 c-12 -63 -20 -121 -17 -130 5 -11 22 -15 66 -15 33
			    0 62 -3 64 -7 3 -7 -50 -298 -68 -370 -6 -25 -35 -45 -168 -117 l-88 -48 3 34
			    c3 51 -6 58 -73 58 -32 0 -59 3 -59 8 0 4 30 157 67 340 56 283 64 335 52 345
			    -10 9 -61 11 -175 9 l-161 -3 -289 -351 c-159 -193 -293 -357 -297 -365 -5 -7
			    -17 -57 -27 -110 -14 -75 -16 -101 -7 -112 10 -11 54 -13 264 -9 139 3 254 4
			    256 2 2 -2 -4 -43 -13 -91 -24 -124 -25 -123 115 -123 66 0 116 4 120 10 3 6
			    12 41 19 78 l12 67 68 3 c48 2 73 -1 85 -11 27 -24 51 -27 96 -16 32 8 53 8
			    80 -1 35 -12 35 -12 33 -63 l-3 -52 132 -3 c145 -3 134 -8 148 68 12 65 15 69
			    53 76 20 4 59 15 85 25 26 11 50 19 52 19 3 0 5 -18 5 -40 0 -58 23 -106 62
			    -127 30 -17 59 -18 353 -15 176 2 337 8 358 13 51 13 100 59 125 116 25 59
			    102 457 96 498 -3 21 25 106 95 285 l98 255 76 6 c41 4 106 16 145 28 79 24
			    151 20 177 -9 15 -16 10 -18 -77 -22 -149 -8 -217 -51 -253 -159 -28 -88 -87
			    -411 -80 -446 3 -19 19 -48 35 -66 l28 -32 277 -3 c254 -3 276 -4 272 -20 -3
			    -9 -11 -46 -17 -82 -21 -108 -5 -100 -210 -100 l-180 0 0 23 c0 12 4 38 9 58
			    15 64 6 69 -130 69 -139 0 -129 9 -154 -131 -28 -158 -17 -215 49 -255 29 -18
			    52 -19 346 -16 200 1 331 6 359 14 58 15 114 71 135 134 25 77 166 814 166
			    869 0 96 -56 145 -166 145 l-56 0 7 27 c21 82 18 109 -14 145 -17 20 -44 41
			    -61 48 -16 7 -30 16 -30 20 0 5 22 25 50 45 113 83 223 237 268 377 44 135 52
			    184 52 327 0 95 -5 148 -20 206 -24 94 -25 117 -4 156 18 36 40 34 105 -6 21
			    -14 41 -25 44 -25 9 0 5 67 -6 122 -14 66 -40 118 -83 166 -24 28 -35 53 -44
			    101 -14 77 -67 193 -111 244 -26 29 -41 66 -72 173 -46 160 -76 238 -136 356
			    -56 110 -194 321 -312 477 -120 159 -192 270 -252 391 -27 55 -51 100 -53 100
			    -2 0 -17 -26 -34 -58z m74 -84 c49 -97 125 -214 236 -360 219 -289 346 -510
			    416 -728 52 -159 55 -170 47 -170 -3 0 -36 24 -73 53 -92 74 -234 167 -254
			    167 -2 0 -2 -33 0 -74 4 -94 -11 -131 -103 -252 -100 -130 -125 -193 -138
			    -336 l-10 -118 -36 -12 c-20 -7 -83 -12 -141 -13 l-105 0 -32 55 c-24 40 -44
			    60 -76 75 -55 27 -174 143 -183 179 -4 15 -1 51 6 80 11 49 11 53 -19 110 -34
			    64 -37 90 -20 215 9 69 9 89 -5 131 -22 67 -21 82 15 152 25 49 30 68 24 97
			    -11 62 -8 103 18 207 35 144 62 179 102 134 11 -12 28 -20 39 -18 19 3 21 9
			    18 72 -3 83 17 159 55 204 l28 34 31 -18 c47 -27 60 -15 67 59 6 66 33 147 48
			    147 5 0 25 -33 45 -72z m-2406 -1004 c141 -142 270 -230 433 -295 28 -12 216
			    -79 418 -149 477 -167 629 -223 629 -232 0 -5 -12 -8 -27 -8 -26 0 -37 -17
			    -175 -284 -82 -155 -148 -291 -148 -300 0 -15 9 -16 67 -14 l68 3 23 43 23 42
			    94 0 c101 0 105 -2 105 -61 l0 -29 69 0 c39 0 72 4 76 9 3 5 1 72 -5 148 -25
			    317 -29 388 -22 394 11 10 192 -50 192 -64 0 -7 -21 -112 -46 -234 -26 -122
			    -44 -228 -41 -237 6 -14 30 -16 204 -14 l197 3 12 60 c7 33 10 63 8 67 -3 5
			    -59 8 -125 8 -109 0 -119 2 -119 18 0 21 56 292 62 297 2 2 44 -5 93 -16 179
			    -37 410 -34 472 7 20 12 23 23 23 77 0 150 43 268 144 392 77 96 106 156 106
			    222 0 31 4 53 11 53 15 0 173 -109 237 -164 100 -86 175 -191 201 -284 9 -28
			    7 -34 -14 -48 -21 -13 -29 -13 -82 0 -127 32 -305 47 -317 27 -10 -16 26 -115
			    60 -166 61 -92 268 -275 310 -275 16 0 23 -8 27 -27 3 -16 15 -75 27 -133 27
			    -128 22 -239 -15 -386 -32 -125 -67 -200 -143 -300 -69 -91 -116 -136 -198
			    -191 l-56 -37 52 -15 c57 -15 120 -67 120 -97 0 -16 -2 -16 -16 4 -13 19 -74
			    59 -74 48 0 -2 7 -21 16 -41 10 -25 13 -50 9 -74 l-7 -36 -19 50 c-20 53 -79
			    115 -111 115 -23 0 -158 -67 -158 -79 0 -5 11 -11 23 -15 28 -7 77 -53 77 -72
			    0 -25 -35 -15 -51 15 -14 24 -26 30 -80 40 -57 9 -72 8 -129 -10 -36 -12 -105
			    -24 -154 -28 l-88 -6 -89 -230 c-49 -126 -93 -240 -99 -252 l-10 -23 -32 20
			    c-31 19 -51 20 -290 20 -200 0 -258 3 -258 13 1 22 27 134 34 145 5 9 90 12
			    306 12 l298 0 10 48 c25 114 35 181 29 196 -6 14 -35 16 -247 16 l-241 0 62
			    70 c59 65 68 82 139 262 93 235 163 398 196 457 l24 44 -42 -40 c-50 -45 -135
			    -95 -193 -113 -22 -7 -58 -26 -79 -43 -28 -22 -41 -27 -44 -18 -3 8 -13 22
			    -23 32 -17 17 -35 19 -155 19 l-137 0 7 47 c3 25 8 48 9 50 2 1 77 5 168 8
			    l164 5 13 51 c7 28 11 58 8 65 -4 11 -44 14 -201 14 -275 0 -273 2 -315 -191
			    -24 -114 -24 -111 -1 -140 18 -23 27 -24 163 -29 l143 -6 -40 -18 c-31 -14
			    -56 -17 -120 -14 -89 5 -158 32 -238 93 -25 19 -76 46 -113 60 -79 30 -154 75
			    -154 92 0 9 39 13 147 15 l147 3 12 60 c7 33 10 63 8 67 -3 5 -88 8 -188 8
			    -179 0 -184 -1 -220 -25 -50 -34 -76 -26 -147 44 -31 31 -72 65 -90 76 l-34
			    20 50 3 c28 2 53 6 57 10 3 4 20 75 38 157 37 180 39 187 49 180 5 -2 52 -81
			    106 -175 l97 -171 51 3 52 3 11 55 c26 127 86 409 99 465 7 33 10 64 6 68 -4
			    4 -37 7 -72 5 l-64 -3 -31 -148 c-17 -81 -34 -150 -37 -153 -4 -5 -31 39 -141
			    239 l-38 67 -68 0 c-57 0 -70 -3 -74 -17 -3 -10 -30 -137 -61 -283 -31 -145
			    -58 -266 -60 -268 -8 -9 -25 10 -25 29 0 11 -11 30 -24 43 l-25 22 24 115 c13
			    63 35 166 48 229 14 63 23 118 20 123 -2 4 -35 7 -73 7 -68 0 -70 -1 -76 -27
			    -30 -133 -27 -127 -70 -134 -21 -4 -42 -5 -46 -2 -5 2 -8 24 -8 49 0 25 -5 54
			    -10 65 -17 31 -64 49 -130 49 -49 0 -62 3 -66 18 -12 37 -26 59 -75 117 -47
			    56 -91 157 -75 172 5 5 356 -92 411 -114 8 -3 15 -1 15 3 0 5 -31 21 -68 36
			    -276 112 -415 285 -380 474 6 35 14 64 17 64 4 0 45 -39 91 -86z m3320 -711
			    c37 -42 75 -120 84 -175 8 -43 1 -46 -47 -21 -18 9 -59 19 -92 22 -56 6 -61 8
			    -89 48 -25 37 -28 46 -18 67 12 26 98 95 118 96 7 0 27 -17 44 -37z m-3210
			    -124 c0 -6 -4 -7 -10 -4 -5 3 -10 11 -10 16 0 6 5 7 10 4 6 -3 10 -11 10 -16z
			    m1380 -146 l0 -93 -53 0 c-30 0 -57 3 -60 6 -4 4 17 52 45 106 35 70 53 96 59
			    86 5 -7 9 -55 9 -105z m-1151 20 c-10 -48 -19 -91 -19 -95 0 -14 -21 -9 -51
			    13 -32 23 -37 57 -16 119 12 34 33 47 84 49 l21 1 -19 -87z m2534 -1228 c34
			    -33 55 -84 42 -105 -3 -5 -29 -10 -56 -10 -43 0 -51 3 -58 24 -5 13 -26 37
			    -46 54 l-37 30 43 20 c61 28 71 27 112 -13z m137 -75 c0 -16 -4 -32 -10 -35
			    -6 -4 -10 10 -10 35 0 25 4 39 10 35 6 -3 10 -19 10 -35z m-43 -306 c3 -10 -2
			    -62 -13 -118 l-19 -101 -184 -3 c-102 -1 -188 1 -192 5 -8 9 27 203 39 215 4
			    4 75 9 157 11 83 1 163 4 178 5 18 1 30 -4 34 -14z m-2863 -280 c-20 -98 -41
			    -182 -48 -186 -13 -9 -236 -11 -236 -2 0 9 312 376 316 371 2 -2 -12 -84 -32
			    -183z m1106 129 c0 -5 -9 -59 -21 -121 -15 -82 -18 -116 -10 -125 8 -11 70
			    -13 306 -9 166 3 300 1 305 -4 9 -9 -2 -80 -14 -91 -3 -3 -29 -1 -58 4 -95 18
			    -137 8 -203 -48 -43 -37 -65 -49 -84 -47 -19 2 -25 8 -24 23 2 11 0 30 -2 43
			    -5 21 -9 22 -134 22 l-129 0 -17 -89 -17 -89 -47 -20 c-55 -24 -123 -43 -129
			    -37 -4 4 72 416 84 458 3 9 45 44 92 77 87 59 102 67 102 53z m-510 -315 c0
			    -16 -60 -301 -64 -305 -2 -3 -20 1 -39 8 -27 9 -44 9 -82 0 -45 -11 -51 -10
			    -78 9 -22 17 -37 20 -64 15 -44 -8 -93 2 -93 20 0 11 19 15 72 17 l73 3 10 50
			    11 50 120 67 c107 60 134 74 134 66z m1013 -60 l59 -12 -7 -46 c-4 -25 -12
			    -51 -17 -57 -13 -17 -358 -19 -358 -3 0 12 10 16 60 24 22 4 55 23 86 50 43
			    38 63 48 108 55 6 0 36 -4 69 -11z"/>
			    <path d="M1400 3444 c0 -3 -22 -111 -50 -239 -27 -128 -50 -236 -50 -239 0 -9
			    410 -7 410 2 0 4 9 50 21 102 11 52 24 115 29 140 5 25 18 87 30 139 11 52 20
			    96 20 98 0 2 -92 3 -205 3 -113 0 -205 -3 -205 -6z m370 -29 c0 -8 -14 -78
			    -31 -157 -16 -79 -36 -170 -43 -203 l-12 -60 -172 -3 c-147 -2 -172 0 -172 12
			    0 9 8 53 19 98 10 46 26 121 36 168 10 47 22 102 27 123 l9 37 169 0 c142 0
			    170 -2 170 -15z"/>
			    <path d="M2067 3263 c-3 -5 -17 -66 -31 -138 -15 -71 -29 -140 -32 -153 l-5
			    -23 133 3 132 3 8 30 c14 55 58 264 58 275 0 12 -256 14 -263 3z"/>
			    <path d="M817 3073 c-2 -5 -15 -60 -27 -123 -13 -63 -28 -121 -33 -127 -7 -9
			    -45 -13 -126 -13 l-117 0 -28 -127 c-15 -71 -43 -202 -62 -293 -20 -91 -38
			    -173 -40 -182 -5 -17 12 -18 255 -18 239 0 260 1 265 18 3 9 19 85 36 167 17
			    83 34 162 37 178 5 25 9 27 54 27 26 0 50 3 52 8 3 4 26 106 52 227 25 121 49
			    230 52 243 l5 22 -185 0 c-102 0 -188 -3 -190 -7z m-71 -296 c3 -8 -4 -53 -14
			    -100 -10 -48 -16 -89 -14 -92 3 -3 56 -5 119 -5 62 0 113 -3 113 -7 0 -10 -58
			    -281 -68 -318 l-8 -30 -227 -3 c-125 -1 -227 0 -227 2 0 3 18 90 40 193 22
			    103 48 226 57 272 20 98 22 99 141 100 60 1 84 -3 88 -12z"/>
			    <path d="M1401 2880 c-88 -21 -120 -68 -155 -226 -13 -60 -36 -169 -51 -241
			    l-29 -133 -87 0 -88 0 -9 -37 c-5 -21 -35 -162 -66 -313 -32 -151 -61 -282
			    -65 -290 -6 -11 -31 -16 -87 -20 l-78 -5 -13 -55 c-18 -78 -113 -527 -113
			    -534 0 -4 118 -5 262 -4 l262 3 27 126 c14 69 29 138 33 152 l6 27 202 2 202
			    3 47 220 c26 121 53 245 61 275 l13 55 72 3 71 3 16 77 c9 42 19 87 22 100 4
			    21 2 22 -66 22 -80 0 -78 -3 -55 95 25 104 40 95 -166 95 -167 0 -180 1 -176
			    18 3 9 22 94 43 189 20 94 40 177 45 185 6 10 64 14 255 18 l248 5 12 48 c7
			    27 15 71 19 98 l7 49 -294 -1 c-161 -1 -308 -5 -327 -9z m-248 -637 c2 -5 -4
			    -46 -14 -93 -10 -47 -18 -112 -19 -146 0 -52 3 -64 26 -85 25 -24 28 -24 260
			    -27 129 -2 234 -7 234 -12 0 -4 -16 -84 -36 -177 -19 -92 -43 -206 -52 -253
			    l-18 -85 -187 -3 c-151 -2 -187 0 -187 11 0 12 30 161 45 225 l5 22 -159 0
			    c-88 0 -162 4 -165 8 -5 8 119 596 129 612 7 12 132 14 138 3z m559 -31 c-2
			    -18 -9 -52 -16 -75 l-12 -42 -159 0 -160 0 1 50 c1 28 7 62 13 78 l11 27 162
			    -2 163 -3 -3 -33z"/>
			    <path d="M2262 2863 c-5 -10 -73 -141 -151 -290 -78 -150 -140 -277 -136 -283
			    3 -5 35 -10 71 -10 l64 0 22 45 22 46 96 -3 95 -3 5 -40 5 -40 69 -3 c38 -2
			    72 1 77 5 5 6 -32 553 -40 591 -1 1 -44 2 -96 2 -80 0 -96 -3 -103 -17z m77
			    -320 l1 -53 -60 0 c-33 0 -60 2 -60 5 0 3 23 51 52 108 l52 102 7 -55 c4 -30
			    7 -79 8 -107z"/>
			    <path d="M2682 2823 c-5 -32 -8 -61 -5 -65 2 -5 76 -8 164 -8 178 0 167 6 148
			    -80 l-11 -50 -94 0 c-70 0 -92 3 -90 13 3 6 7 25 10 40 l7 28 -78 -3 -78 -3
			    -17 -80 c-9 -44 -28 -133 -42 -199 -14 -65 -23 -123 -20 -127 3 -5 36 -9 74
			    -9 79 0 68 -14 98 130 l17 85 89 3 c49 2 92 -1 96 -5 4 -4 -1 -48 -11 -98 -11
			    -49 -17 -96 -14 -102 3 -9 27 -13 73 -13 l69 0 21 98 c24 104 27 149 13 171
			    -6 10 -3 23 10 40 19 26 59 180 59 226 0 14 -9 34 -20 45 -19 19 -33 20 -239
			    20 l-219 0 -10 -57z"/>
			    <path d="M2037 2078 c-9 -46 -17 -89 -17 -95 0 -10 67 -13 282 -15 326 -3 299
			    8 277 -117 -19 -112 -17 -111 -213 -111 -91 0 -167 4 -170 9 -4 5 1 38 9 73 8
			    35 15 66 15 71 0 4 -49 7 -109 7 -96 0 -110 -2 -115 -17 -3 -10 -19 -85 -36
			    -166 -17 -82 -44 -210 -60 -285 -17 -75 -30 -137 -30 -139 0 -2 -34 -3 -75 -3
			    -90 0 -83 11 -120 -175 -15 -71 -29 -138 -31 -147 -5 -17 6 -18 139 -18 l145
			    0 11 53 c6 28 16 75 23 104 l11 51 296 4 c316 3 317 3 374 56 32 30 54 96 87
			    263 27 134 23 164 -21 183 l-31 13 35 21 c48 28 64 63 93 198 37 174 32 219
			    -26 249 -24 13 -86 15 -377 15 l-349 0 -17 -82z m481 -511 c5 -38 -27 -175
			    -45 -192 -12 -12 -49 -15 -189 -15 -96 0 -174 2 -174 5 0 8 40 197 46 218 5
			    16 20 17 182 15 l177 -3 3 -28z m-666 -359 l-4 -48 47 0 c46 0 47 -1 42 -27
			    -4 -16 -12 -56 -18 -90 l-12 -63 -114 0 c-62 0 -113 4 -113 9 0 16 51 255 56
			    263 3 5 31 8 62 6 l57 -3 -3 -47z"/>
			    <path d="M3003 2145 c-17 -7 -38 -24 -46 -37 -12 -19 -78 -303 -103 -440 -17
			    -101 15 -118 228 -118 84 0 169 5 189 10 72 20 77 33 154 397 31 146 28 175
			    -21 193 -41 16 -363 12 -401 -5z m277 -138 c0 -14 -58 -286 -65 -304 -5 -14
			    -190 -19 -198 -5 -4 7 8 71 44 230 l21 92 99 0 c73 0 99 -3 99 -13z"/>
			    <path d="M3530 2135 c-5 -14 -11 -45 -12 -68 l-3 -42 63 -3 c69 -3 69 -4 52
			    -75 -43 -186 -80 -379 -75 -387 3 -6 37 -10 75 -10 57 0 70 3 74 18 2 9 14 64
			    26 122 19 93 51 245 65 308 5 20 11 22 75 22 l69 0 10 38 c5 20 11 51 13 67
			    l3 30 -213 3 -212 2 -10 -25z"/>
			    <path d="M137 2023 c-33 -147 -50 -244 -43 -250 7 -8 235 -8 242 0 5 5 64 282
			    64 302 0 13 -20 15 -124 15 l-124 0 -15 -67z"/>
			    <path d="M935 808 c-13 -40 -71 -329 -67 -333 3 -3 65 -5 138 -5 l133 0 9 38
			    c12 48 49 226 58 275 l6 37 -136 0 c-100 0 -138 -3 -141 -12z"/>
			    </g>
			  </svg>
      </Flex>
      <Stack alignItems='start' width={!userStore.userData ? ['80%', '65%', '50%'] : ['90%', '80%']} flexGrow={1} spacing={4}>
        <Box flexGrow={1}/>
        <Box rounded='lg' padding={4} backgroundColor='white' alignSelf='stretch'>
          <Link href='https://forms.gle/XM7bCFJi5sBdQkkRA'>
            <Text fontSize='xl' textAlign='center' color='cardinalbotics.red.400' fontWeight='bold'>
              Feedback / Bug Reporting Google Form
            </Text>
          </Link>
        </Box>
        <Box flexGrow={2}/>
        {!userStore.userData ? <Onboarding/> : (
          <Stack width='100%' spacing={4}>
            <Account/>
            <Tabs
              size='lg'
              variantColor='cardinalbotics.red'
              borderBottomColor='gray.300'
            >
              <TabList>
                <Tab marginRight={3}>Your Past Sessions</Tab>
                <Tab>Other Active Members</Tab>
              </TabList>
              <TabPanels>
                <TabPanel>
                  <SessionsTable marginBottom={10}/>
                </TabPanel>
                <TabPanel>
                  <OtherUsersTable/>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </Stack>
        )}
        <Box flexGrow={16}/>
      </Stack>
    </Stack>
  ));
}

const HomePageWithContext: React.FC = (props) => (
  <UserContext.Provider value={new UserStore()}>
    <TimeContext.Provider value={new TimeStore()}>
      <HomePage {...props}/>
    </TimeContext.Provider>
  </UserContext.Provider>
)

export default HomePageWithContext;

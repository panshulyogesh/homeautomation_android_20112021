import React, {useState, createRef, useEffect} from 'react';

import {
  TouchableOpacity,
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TextInput,
  Button,
  Alert,
  Modal,
  Pressable,
  StatusBar,
  Dimensions,
} from 'react-native';

import * as Animatable from 'react-native-animatable';
import {MaskedTextInput} from 'react-native-mask-text';
import LinearGradient from 'react-native-linear-gradient';

import FontAwesome from 'react-native-vector-icons/FontAwesome';

import Feather from 'react-native-vector-icons/Feather';
//! conf variable is declared and defined as false by default and is used for validating pwd status in registration screen
let conf = {
  pwd_status: false,
};

import {openDatabase} from 'react-native-sqlite-storage';
var db = openDatabase({name: 'UserDatabase.db'});
import AsyncStorage from '@react-native-async-storage/async-storage';
import {pwd_status} from './FirstPage';
import TcpSocket from 'react-native-tcp-socket';

import ReactNativeForegroundService from '@supersami/rn-foreground-service';

import TcpSocket from 'react-native-tcp-socket';

import {DeviceEventEmitter} from 'react-native';

const OwnerRegistration = ({navigation}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [OwnerName, setOwnerName] = useState('');
  const [password, setpassword] = useState('');
  // const [pw, setpw] = useState('');
  const [MailId, setMailId] = useState('');
  const [PhoneNumber, setPhoneNumber] = useState('');
  const [Property_name, setProperty_name] = useState('');
  const [Street, setStreet] = useState('');
  const [Area, setArea] = useState('');
  const [State, setState] = useState('');
  const [pincode, setpincode] = useState('');
  const [Door_Number, setDoor_Number] = useState('');
  const [router_ssid, setrouter_ssid] = useState('');
  const [router_password, setrouter_password] = useState('');
  const [DAQ_STACTIC_IP, setDAQ_STACTIC_IP] = useState('');
  const [DAQ_STACTIC_Port, setDAQ_STACTIC_Port] = useState('');
  const [lan_ip, setlan_ip] = useState('');
  const [gatewayphno, setgatewayphno] = useState('');

  async function handleSubmitPress() {
    setModalVisible(!modalVisible);
    if (
      !OwnerName ||
      !password ||
      !MailId ||
      !PhoneNumber ||
      !Property_name ||
      !Area ||
      !State ||
      !pincode ||
      !Street ||
      !Door_Number ||
      !router_ssid ||
      !router_password ||
      !DAQ_STACTIC_IP ||
      !DAQ_STACTIC_Port ||
      !lan_ip
    ) {
      alert('Please fill all the fields');
      return;
    }

    db.transaction(function (tx) {
      tx.executeSql(
        `INSERT INTO Owner_Reg ( 
              owner_name, owner_password,MailId,PhoneNumber,Property_name ,Area ,State ,pincode ,Street,Door_Number,
              router_ssid ,router_password ,DAQ_STACTIC_IP , DAQ_STACTIC_Port,lan_ip,gatewayphno)
               VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [
          OwnerName.toString().toUpperCase(),
          password.toString().toUpperCase(),
          MailId.toString(),
          PhoneNumber.toString().toUpperCase(),
          Property_name.toString().toUpperCase(),
          Area.toString().toUpperCase(),
          State.toString().toUpperCase(),
          pincode.toString().toUpperCase(),
          Street.toString().toUpperCase(),
          Door_Number.toString().toUpperCase(),
          router_ssid.toString(),
          router_password.toString(),
          DAQ_STACTIC_IP.toString(),
          DAQ_STACTIC_Port.toString(),
          lan_ip.toString(),
          gatewayphno.toString(),
        ],
        (tx, results) => {
          console.log('Results', results.rowsAffected);
          if (results.rowsAffected > 0) {
            Alert.alert(
              'Success',
              'Data is updated',
              [
                {
                  text: 'Ok',
                  onPress: () => navigation.navigate('FirstPage'),
                },
              ],
              {cancelable: false},
            );

            AsyncStorage.setItem('pwdstatus', JSON.stringify(false));
          }

          onStart(DAQ_STACTIC_IP, DAQ_STACTIC_Port, gatewayphno);
        },
        (tx, error) => {
          console.log('error', error);
        },
      );
    });
  }

  function tcpsocket(DAQ_STACTIC_IP, DAQ_STACTIC_Port, gatewayphno) {
    let server = TcpSocket.createServer(function (socket) {
      socket.on('data', data => {
        let str = data.toString();
        //  console.log('data fromm browseer', str);

        let data_obtained = '';
        let add_flag = 0;

        for (let i = 0; i < str.length; i++) {
          if (str[i] == '%') {
            add_flag = 0;
          }
          if (add_flag == 1) {
            data_obtained = data_obtained + str[i];
          }
          if (str[i] == '$') {
            add_flag = 1;
          }
        }
        console.log('data_obtained', data_obtained);

        let arr_split1 = data_obtained.split(';');
        let arr_split2 = arr_split1[1].split('|');
        console.log(arr_split1);
        console.log(arr_split2);
        storeindb(arr_split1, arr_split2);

        // let s = '';
        // arr_split1.forEach(element => {
        //   storeindb(element.split('|'));
        // });
      });
      socket.on('error', error => {
        console.log('An error ocurred with client socket ', error);
      });

      socket.on('close', error => {
        console.log('Closed connection with ', socket.address());
      });
    });
    gatewayphno;
    server.listen({port: DAQ_STACTIC_Port, host: DAQ_STACTIC_IP}, () =>
      console.log('server is running on port 9000'),
    );
    server.on('error', error => {
      console.log('An error ocurred with the server', error);
    });

    server.on('close', () => {
      console.log('Server closed connection');
    });

    setInterval(getSMS, sms_poll_interval);
  }

  function getSMS() {
    // delay =  get current time - interval
    //read all msgs which  are recieved greater than delay
    console.log('READING FOR MESSAGES from ', PhoneNumber);
    let filter = {
      box: 'inbox', // 'inbox' (default), 'sent', 'draft', 'outbox', 'failed', 'queued', and '' for all
      // the next 4 filters should NOT be used together, they are OR-ed so pick one
      read: 0, // 0 for unread SMS, 1 for SMS already read
      address: PhoneNumber, // sender's phone number
      //body: 'home_automation_command', // content to match
      // the next 2 filters can be used for pagination
      indexFrom: 0, // start from index 0
      maxCount: 10, // count of SMS to return each time
    };
    SmsAndroid.list(
      JSON.stringify(filter),
      fail => {
        console.log('Failed with this error: ' + fail);
      },
      (count, smsList) => {
        //  console.log('Count: ', count);
        console.log('List: ', smsList);
        var arr = JSON.parse(smsList);

        arr.forEach(function (object) {
          // console.log('Object: ' + object);
          // console.log('-->' + object.date);
          // console.log('-->' + object.body);

          if (object.address == '+917829890730') {
            console.log('correct  validation');
            console.log('message -->' + object.body);
            let url =
              'http://' +
              owner.lan_ip +
              ':' +
              findobj.portnumber +
              '/$' +
              object.body +
              '%';
            // 'http://172.16.9.146:8085/$84:0D:8E:1B:CD:20/SET/PANSHUL;84:0d:8e:1b:cd:20/0-0;GPIO0;%';
            console.log('url ==> ', url);
            fetch(url, {
              method: 'GET',
              headers: {
                'Content-Type': 'text/html',
              },
            })
              .then(response => response.json())
              .then(data => {
                console.log(data);
                let split = data.split(':');
                //alert(data);
                SendSMS.send(
                  {
                    body: data.toString(),
                    recipients: [split[3]],
                    successTypes: ['sent', 'queued'],
                    allowAndroidSendWithoutReadPermission: true,
                  },
                  (completed, cancelled, error) => {
                    if (completed) {
                      console.log('SMS Sent Completed');
                    } else if (cancelled) {
                      console.log('SMS Sent Cancelled');
                    } else if (error) {
                      console.log('Some error occured');
                    }
                  },
                );
              });
          }
          alert('your message with selected id is --->' + object.body);
        });
      },
    );
  }

  function storeindb(params1, params2) {
    console.log('--------------------');
    console.log('macid', params1[0]);
    console.log('data', params2);

    db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM Binding_Reg where (macid = ?)',
        [params1[0]],
        (tx, results) => {
          // var temp = [];
          // for (let i = 0; i < results.rows.length; ++i)
          //   temp.push(results.rows.item(i));
          console.log('results', results);
          console.log('len', temp.length);
          console.log(results.rows.item(0));

          if (results.rows.item(0).pin_direction == 'in') {
            console.log('DATA TO BE STOREDD');
            for (let i = 0; i < params2.length - 1; i++) {
              logdata(results.rows.item(0), params2[i]);
            }
          }
        },
        (tx, err) => {
          console.log('err', err);
        },
      );
    });
  }

  function logdata(params1, params3) {
    console.log('-------------logdata');
    console.log(params1);
    console.log(params3);
    var today = new Date();
    var date =
      today.getFullYear() +
      '-' +
      (today.getMonth() + 1) +
      '-' +
      today.getDate();
    var date1 = today.getFullYear() + (today.getMonth() + 1) + today.getDate();
    var time =
      today.getHours() + ':' + today.getMinutes() + ':' + today.getSeconds();
    var dateTime = date + ' ' + time;
    console.log('datetime', dateTime);

    db.transaction(function (tx) {
      tx.executeSql(
        `INSERT INTO data_logger (date_time, location, longitude,
         latitude, value, unit ) SELECT ?,?,?,?,?,?,?,?,?,?,?`,
        [
          datetime,
          'logid',
          params1.location,
          'long',
          'lat',
          params3,
          params1.unit,
        ],
        (tx, results) => {
          console.log('Results', results.rowsAffected);
          if (results.rowsAffected > 0) {
            console.log('success in storing data');
          } else console.log('failed');
        },
        (tx, error) => {
          console.log('error', error);
        },
      );
    });
  }

  const onStart = (DAQ_STACTIC_IP, DAQ_STACTIC_Port, gatewayphno) => {
    // Checking if the task i am going to create already exist and running, which means that the foreground is also running.
    if (ReactNativeForegroundService.is_task_running('taskid')) return;
    // Creating a task.
    ReactNativeForegroundService.add_task(
      () => tcpsocket(DAQ_STACTIC_IP, DAQ_STACTIC_Port, gatewayphno),
      {
        //delay: 1000000,
        onLoop: false,
        taskId: 'taskid',
        onError: e => console.log(`Error logging:`, e),
      },
    );
    // starting  foreground service.
    return ReactNativeForegroundService.start({
      id: 144,
      title: 'DATA LOGGER IS RUNNING ',
      message: 'you are online!',
    });
  };

  const onStop = () => {
    // Make always sure to remove the task before stoping the service. and instead of re-adding the task you can always update the task.
    if (ReactNativeForegroundService.is_task_running('taskid')) {
      ReactNativeForegroundService.remove_task('taskid');
    }
    // Stoping Foreground service.
    return ReactNativeForegroundService.stop();
  };

  useEffect(() => {
    let subscription = DeviceEventEmitter.addListener(
      'notificationClickHandle',
      function (e) {
        console.log('Clicked on Foreground Service', e);
      },
    );
    return function cleanup() {
      subscription.remove();
    };
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#008080" barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.text_header}>Register Now!</Text>
      </View>
      <Animatable.View animation="fadeInUpBig" style={styles.footer}>
        <ScrollView>
          <Text style={styles.text_footer}>Enter Your Name </Text>
          <View style={styles.action}>
            <TextInput
              style={styles.textInput}
              autoCapitalize="none"
              placeholderTextColor="#05375a"
              placeholder="Owner Name"
              onChangeText={OwnerName => setOwnerName(OwnerName)}
            />
          </View>
          <Text style={styles.text_footer}>Enter Your Mail Id</Text>
          <View style={styles.action}>
            <TextInput
              style={styles.textInput}
              autoCapitalize="none"
              placeholderTextColor="#05375a"
              placeholder="Mail Id"
              onChangeText={MailId => setMailId(MailId)}
            />
          </View>
          <Text style={styles.text_footer}>Enter Your Phone Number</Text>
          <View style={styles.action}>
            <TextInput
              style={styles.textInput}
              autoCapitalize="none"
              placeholderTextColor="#05375a"
              placeholder="Phone Number"
              keyboardType="numeric"
              onChangeText={PhoneNumber => setPhoneNumber(PhoneNumber)}
            />
          </View>
          <Text style={styles.text_footer}>Enter Your Property Name</Text>
          <View style={styles.action}>
            <TextInput
              style={styles.textInput}
              autoCapitalize="none"
              placeholderTextColor="#05375a"
              placeholder="Property Name"
              onChangeText={Property_name => setProperty_name(Property_name)}
            />
          </View>
          <Text style={styles.text_footer}>Enter Your City/Town/Village</Text>
          <View style={styles.action}>
            <TextInput
              style={styles.textInput}
              autoCapitalize="none"
              placeholderTextColor="#05375a"
              placeholder="City/Town/Village"
              onChangeText={Area => setArea(Area)}
            />
          </View>
          <Text style={styles.text_footer}>Enter Your State</Text>
          <View style={styles.action}>
            <TextInput
              style={styles.textInput}
              autoCapitalize="none"
              placeholderTextColor="#05375a"
              placeholder="State"
              onChangeText={State => setState(State)}
            />
          </View>
          <Text style={styles.text_footer}>Enter Your Pin Code</Text>
          <View style={styles.action}>
            <TextInput
              style={styles.textInput}
              autoCapitalize="none"
              placeholderTextColor="#05375a"
              placeholder="pin code"
              onChangeText={pincode => setpincode(pincode)}
            />
          </View>
          <Text style={styles.text_footer}>Enter Your Street</Text>
          <View style={styles.action}>
            <TextInput
              style={styles.textInput}
              autoCapitalize="none"
              placeholderTextColor="#05375a"
              placeholder="Street"
              onChangeText={Street => setStreet(Street)}
            />
          </View>
          <Text style={styles.text_footer}>
            Enter Your Apartment Number/House Number
          </Text>
          <View style={styles.action}>
            <TextInput
              style={styles.textInput}
              autoCapitalize="none"
              placeholderTextColor="#05375a"
              placeholder="Apartment Number/House Number"
              onChangeText={Door_Number => setDoor_Number(Door_Number)}
            />
          </View>
          <View style={styles.action}>
            <TextInput
              style={styles.textInput}
              autoCapitalize="none"
              placeholderTextColor="#05375a"
              placeholder="router_ssid"
              onChangeText={router_ssid => setrouter_ssid(router_ssid)}
            />
          </View>
          <View style={styles.action}>
            <TextInput
              style={styles.textInput}
              autoCapitalize="none"
              placeholderTextColor="#05375a"
              placeholder="router_password"
              onChangeText={router_password =>
                setrouter_password(router_password)
              }
            />
          </View>
          <View style={styles.action}>
            <TextInput
              style={styles.textInput}
              autoCapitalize="none"
              placeholderTextColor="#05375a"
              placeholder="lan_ip"
              onChangeText={lan_ip => setlan_ip(lan_ip)}
            />
          </View>
          <View style={styles.action}>
            <MaskedTextInput
              style={styles.textInput}
              placeholderTextColor="#05375a"
              keyboardType="numeric"
              placeholder=" daq static IP"
              mask="999-999-9-9"
              onChangeText={(text, rawText) => {
                setDAQ_STACTIC_IP(text);
                // console.log(rawText);
              }}
            />
          </View>
          <View style={styles.action}>
            <TextInput
              style={styles.textInput}
              autoCapitalize="none"
              placeholderTextColor="#05375a"
              placeholder="DAQ_STACTIC_Port"
              onChangeText={DAQ_STACTIC_Port =>
                setDAQ_STACTIC_Port(DAQ_STACTIC_Port)
              }
            />
          </View>
          <Text style={styles.text_footer}>
            Enter Your gateway Phone Number
          </Text>
          <View style={styles.action}>
            <TextInput
              style={styles.textInput}
              autoCapitalize="none"
              placeholderTextColor="#05375a"
              placeholder="gateway Phone Number"
              keyboardType="numeric"
              onChangeText={gatePhoneNumber => setgatewayphno(gatePhoneNumber)}
            />
          </View>
          <View style={styles.centeredView}>
            <Modal
              animationType="slide"
              transparent={true}
              visible={modalVisible}
              onRequestClose={() => {
                setModalVisible(!modalVisible);
              }}>
              <View style={styles.centeredView}>
                <View style={styles.modalView}>
                  <Text style={styles.modalText}>ENTER NEW PASSWORD</Text>
                  <TextInput
                    style={{
                      borderWidth: 2,
                      padding: 10,
                      color: '#05375a',
                    }}
                    placeholderTextColor="#05375a"
                    placeholder="Enter password"
                    onChangeText={password => setpassword(password)}
                  />
                  <Pressable style={styles.signIn} onPress={handleSubmitPress}>
                    <LinearGradient
                      colors={[`#008080`, '#01ab9d']}
                      style={styles.signIn}>
                      <Text
                        style={[
                          styles.textSign,
                          {
                            color: '#fff',
                          },
                        ]}>
                        Submit
                      </Text>
                    </LinearGradient>
                  </Pressable>
                </View>
              </View>
            </Modal>
            <Pressable
              style={styles.signIn}
              onPress={() => setModalVisible(true)}>
              <LinearGradient
                colors={[`#008080`, '#01ab9d']}
                style={styles.signIn}>
                <Text
                  style={[
                    styles.textSign,
                    {
                      color: '#fff',
                    },
                  ]}>
                  Submit
                </Text>
              </LinearGradient>
            </Pressable>
            {/* <Pressable
              style={styles.signIn}
              onPress={() => setModalVisible(true)}>
              <LinearGradient
                colors={[`#008080`, '#01ab9d']}
                style={styles.signIn}>
                <Text
                  style={[
                    styles.textSign,
                    {
                      color: '#fff',
                    },
                  ]}>
                  reg owner
                </Text>
              </LinearGradient>
            </Pressable> */}
          </View>
        </ScrollView>
      </Animatable.View>
    </View>
  );
};

export default OwnerRegistration;
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: `#008080`,
  },
  header: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 50,
  },
  footer: {
    flex: Platform.OS === 'ios' ? 3 : 5,
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  text_header: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 30,
  },
  text_footer: {
    fontWeight: 'bold',
    color: '#05375a',
    fontSize: 18,
  },
  action: {
    flexDirection: 'row',
    marginTop: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f2f2f2',
    paddingBottom: 5,
  },
  textInput: {
    flex: 1,
    marginTop: Platform.OS === 'ios' ? 0 : -12,
    paddingLeft: 10,
    color: '#05375a',
    borderWidth: 1,
  },
  button: {
    alignItems: 'center',
    marginTop: 50,
  },
  signIn: {
    width: '100%',
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  textSign: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  textPrivate: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 20,
  },
  color_textPrivate: {
    color: 'grey',
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    marginTop: 20,
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalText: {
    marginBottom: 15,
    textAlign: 'center',
  },
});

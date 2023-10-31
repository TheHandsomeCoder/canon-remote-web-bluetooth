// src/BluetoothComponent.tsx
import React, { useState } from 'react';

const DEVICE_NAME = "canoremote";

enum Mode {
  Immediate = 0b00001100,
  Delay = 0b00000100,
  Movie = 0b00001000
}

enum Button {
  Release = 0b10000000,
  Focus = 0b01000000,
  Tele = 0b00100000,
  Wide = 0b00010000
}

enum IntCharacteristic {
  Pairing = 0xf503,
  Event = 0xf505
}

enum UUIDCharacteristic {
  CANON_BLUETOOTH_REMOTE_SERVICE = "00050000-0000-1000-0000-d8492fffa821",
  Pairing = "00050002-0000-1000-0000-d8492fffa821",
  Event = "00050003-0000-1000-0000-d8492fffa821"
}

function delay(time: number) {
  return new Promise(resolve => setTimeout(resolve, time));
}

const App: React.FC = () => {
  const [device, setDevice] = useState<BluetoothDevice | null>(null);

  const initializeBluetooth = async () => {
    try {
      // console.log('Getting existing permitted Bluetooth devices...');
      // navigator.bluetooth.getDevices()
      // .then(devices => {
      //   console.log('> Got ' + devices.length + ' Bluetooth devices.');
      //   for (const device of devices) {
      //     console.log('  > ' + device.name + ' (' + device.id + ')');
      //   }
      // })
      // .catch(error => {
      //   console.log('Argh! ' + error);
      // });

      const btDevice = await navigator.bluetooth.requestDevice({
        filters: [{ services: [UUIDCharacteristic.CANON_BLUETOOTH_REMOTE_SERVICE] }],
        optionalServices: [UUIDCharacteristic.Pairing, UUIDCharacteristic.Event]
      });

      await btDevice.gatt?.connect();
      const service = await btDevice.gatt?.getPrimaryService(UUIDCharacteristic.CANON_BLUETOOTH_REMOTE_SERVICE);
      const characteristic = await service?.getCharacteristic(UUIDCharacteristic.Pairing);
      const DEVICE_NAME = "Web Blue";

      // Create a Uint8Array containing the byte 3 followed by the Unicode code points of DEVICE_NAME
      const data = new Uint8Array([3, ...Array.from(DEVICE_NAME).map(char => char.charCodeAt(0))]);
      await characteristic!.writeValueWithoutResponse(data);
      
      setDevice(btDevice);
    } catch (error) {
      console.error('Bluetooth initialization error:', error);
    }
  };

  const sendState = async (mode: Mode = Mode.Immediate, button: Button = Button.Release) => {
    if (device) {
      const data = new Uint8Array([mode | button]);
      const service = await device.gatt?.getPrimaryService(UUIDCharacteristic.CANON_BLUETOOTH_REMOTE_SERVICE);

      if (service) {
        const characteristic = await service.getCharacteristic(UUIDCharacteristic.Event);
        await characteristic.writeValue(data);
        await delay(200);
        console.log("setting back to imediate")
        await characteristic.writeValue(new Uint8Array([mode]));
        console.log("try again")
      }
    }
  };

  return (
    <div>
      <p>Bluetooth Device: {device ? device.name : 'Not connected'}</p>
      <button onClick={initializeBluetooth}>Initialize Bluetooth</button>
      <button onClick={() => sendState(Mode.Immediate)}>Send Event</button>
    </div>
  );
};
export default App;

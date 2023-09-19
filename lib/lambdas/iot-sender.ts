import { IoTDataPlaneClient, PublishCommand } from '@aws-sdk/client-iot-data-plane';

exports.handler = async (event: any) => {
    console.log({ event });

    const client = new IoTDataPlaneClient();

    const input = {
        topic: 'instagrow/pi/to',
        retain: true,
        payload: JSON.stringify({
            type: 'waterPlant',
            duration: 1000,
        }),
        qos: 0,
    };

    const command = new PublishCommand(input);

    const response = await client.send(command);

    console.log({ response });
};

export enum BridgeCmds {
  NONE = 1,
  CONNECT = 2,
  DISCONNECT = 3,
  GET_CACHE = 4,
}

export enum DeviceIDs {
  NONE = 0,
  SYS = 1,
  HMI = 2,
  SFTY = 3,
  CON = 4,
  DIAG = 5,
  UDP = 6,
  FEED = 7,
  ROB = 10,
  ABB = 11,
  EOAT = 12,
  VIS = 13,
  FIX_T = 14,
  FIX_S = 15,
  CLAMP_T = 16,
  CLAMP_S = 17,
  FLSB_T = 18,
  FLSB_S = 19,
  POT = 20,
  SQUEE = 21,
  GRIP = 22,
  WEIGH = 23,
  LNR = 41,
  GCNV1 = 42,
  GCNV2 = 43,
  ORCH = 44,
  XFER = 45,
  SWARM1 = 46,
  SWARM2 = 27,
  SCARA = 29,
  REOR = 30,
  BAM = 31,
  MTAC = 32,
  IB = 33,
  STW = 34,
  RG = 35,
  RY = 36,
  RZ = 37,
  BSG = 38,
  BSX = 39,
  BSY = 40,
  BSZ = 41,
  IBG = 45,
  IBZ = 46,
  IBX = 47,
  IBZ1 = 48,
  IBZ2 = 49,
  WASH = 50,
  DBRR = 52,
  CNC = 53,
  RACK = 54,
}

export const MqttTopics = {
  BRIDGE_STATUS: "bridge/status",
  BRIDGE_CMD: "bridge/cmd",
  BRIDGE_CACHE: "bridge/cache",
  KIOSK_CONTROL: "bridge/control",
  DEVICE_MAP: "deviceMap",
  HMI_ACTION_REQ: "hmi/action_req",
  EXT_SERVICE: "ext_service",
} as const;

export interface DeviceRegistration {
  mnemonic: string;
  id: number;
  childIdArray: number[];
  parentId: number;
  deviceType: number;
  isExternalService: boolean;
  devicePath?: string[];
}

export interface DeviceStatus {
  state: number;
  stepNum: number;
  stepDescription: string;
  colorCode: number;
  statusMsg: string;
  error: boolean;
  killed: boolean;
  inactive: boolean;
  resetting: boolean;
  idle: boolean;
  running: boolean;
  stopping: boolean;
  paused: boolean;
  pauseRequested: boolean;
  aborting: boolean;
  done: boolean;
  manual: boolean;
  idleOrError: boolean;
  iifkm: boolean;
  rri: boolean;
  ipr: boolean;
  kei: boolean;
  runningOrStopping: boolean;
  allChildrenIdle: boolean;
  allChildrenKilled: boolean;
  allChildrenInactive: boolean;
  allChildrenIdleOrError: boolean;
  commanderId: number;
  recordingLogs: boolean;
}

export interface DeviceCfg {
  safetyZoneId: number;
  controllableByHmi: boolean;
  autoReset: boolean;
  ignore: boolean;
}

export interface FaultData {
  deviceId: number;
  code: number;
  msg: string;
  autoReset: boolean;
  resetFlag: boolean;
  logFlag: boolean;
  timeStamp: Date;
  stepNum: number;
  parentStepNum: number;
}

export interface DeviceFaultData {
  list: FaultData[];
  present: boolean;
  childrenPresent: boolean;
}

export interface DebugLogData {
  msg: string;
  timeStamp: Date;
  id: number;
}

export interface DeviceLogData {
  list: DebugLogData[];
  lastIndex: number;
}

export interface Device {
  is: DeviceStatus;
  errors: DeviceFaultData;
  warnings: DeviceFaultData;
  registration: DeviceRegistration;
  mutedChildrenArray: boolean[];
  cfg: DeviceCfg;
  execMethod: unknown;
  task: unknown;
  process: unknown;
  script: unknown;
  connectionStatus: boolean;
  apiOpcua: unknown;
  log?: DeviceLogData;
  sts?: unknown;
  inputs?: unknown;
  outputs?: unknown;
}

export function buildFullTopicPath(
  device: DeviceRegistration,
  deviceMap: Map<number, DeviceRegistration>,
): string {
  const parts: number[] = [];
  let current: DeviceRegistration | undefined = device;

  while (current) {
    parts.unshift(current.id);

    if (!current.parentId || current.parentId === 0) {
      break;
    }

    const parent = deviceMap.get(current.parentId);
    if (!parent) {
      break;
    }

    current = parent;
  }

  return `machine/${parts.join("/")}`;
}
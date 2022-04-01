import { SubstrateEvent, SubstrateBlock } from "@subql/types";
import { Transfer } from "../types/models/Transfer";
import { BalanceSet } from "../types/models/BalanceSet";
import { Deposit } from "../types/models/Deposit";
import { Reserved } from "../types/models/Reserved";
import { Unreserved } from "../types/models/Unreserved";
import { Withdraw } from "../types/models/Withdraw";
import { Slash } from "../types/models/Slash";
import { ReservRepatriated } from "../types/models/ReservRepatriated";
import { EventRecord } from "@polkadot/types/interfaces/system";
import { Endowed } from "../types";
import { getID } from "../utils";



export async function handleBlock(block: SubstrateBlock): Promise<void> {
  let blockNumber = block.block.header.number.toBigInt();

  let events = block.events;
  let accounts4snapshot: string[] = [];
  for (let i = 0; i < events.length; i++) {
    let event = events[i];
    const {
      event: { method, section, index },
    } = event;

    if (section === "balances") {
      const eventType = `${section}/${method}`;
      logger.info(
        `Block: ${blockNumber}, Event ${eventType}`
      );

      let accounts: string[] = [];
      switch (method) {
        case "Endowed":
          accounts = await handleEndowed(block, event);
          break;
        case "Transfer":
          accounts = await handleTransfer(block, event);
          break;
        case "BalanceSet":
          accounts = await handleBalanceSet(block, event);
          break;
        case "Deposit":
          accounts = await handleDeposit(block, event);
          break;
        case "Reserved":
          accounts = await handleReserved(block, event);
          break;
        case "Withdraw":
          accounts = await handleWithdraw(block, event);
          break;
        case "Unreserved":
          accounts = await handleUnreserved(block, event);
          break;
        case "Slash":
          accounts = await handleSlash(block, event);
          break;
        case "ReservRepatriated":
          accounts = await handleReservRepatriated(block, event);
          break;
        default:
          break;
      }

      for (const a of accounts) {
        if (accounts4snapshot.length > 0 && accounts4snapshot.indexOf(a) > -1) {
          continue;
        }
        accounts4snapshot.push(a);
      }
    }
  }
}


export async function handleEvent(event: SubstrateEvent): Promise<void> { }



async function handleEndowed(
  block: SubstrateBlock,
  substrateEvent: EventRecord
): Promise<string[]> {
  const { event } = substrateEvent;
  const { timestamp: createdAt, block: rawBlock } = block;
  const { number: bn } = rawBlock.header;
  const [accountId, balanceChange] = event.data.toJSON() as [string, bigint];
  let blockNum = bn.toBigInt();

  logger.info(`New Endowed happened!: ${JSON.stringify(event)}`);

  let newEndowed = await Endowed.create({
    id: getID(),
    accountId: accountId,
    freeBalance: BigInt(balanceChange),
    reserveBalance: BigInt(0),
    totalBalance: BigInt(balanceChange),
    blockNumber: blockNum,
    timestamp: block.timestamp,
  });
  await newEndowed.save();

  return [accountId];
}

export const handleTransfer = async (
  block: SubstrateBlock,
  substrateEvent: EventRecord
): Promise<string[]> => {
  const { event } = substrateEvent;
  const { timestamp: createdAt, block: rawBlock } = block;
  const { number: bn } = rawBlock.header;
  const [from, to, balanceChange] = event.data.toJSON() as [
    string,
    string,
    bigint
  ];
  let blockNum = bn.toBigInt();

  logger.info(`New Transfer happened!: ${JSON.stringify(event)}`);

  // Create the new transfer entity
  let aID = getID();
  const transfer = new Transfer(`${aID}`);
  transfer.blockNumber = blockNum;
  transfer.fromAccountId = from;
  transfer.toAccountId = to;
  transfer.balanceChange = BigInt(balanceChange);

  transfer.timestamp = block.timestamp;

  await transfer.save();

  return [from, to];
};

//“AccountId” ‘s free balance =”Balance1”, reserve balance = “Balance2”
export const handleBalanceSet = async (
  block: SubstrateBlock,
  substrateEvent: EventRecord
): Promise<string[]> => {
  const { event } = substrateEvent;
  const { timestamp: createdAt, block: rawBlock } = block;
  const { number: bn } = rawBlock.header;
  const [accountToSet, balance1, balance2] = event.data.toJSON() as [
    string,
    bigint,
    bigint
  ];
  let blockNum = bn.toBigInt();

  logger.info(`BalanceSet happened!: ${JSON.stringify(event)}`);

  // Create the new BalanceSet entity
  let aID = getID();
  const balanceSet = new BalanceSet(`${aID}`);
  balanceSet.accountId = accountToSet;
  balanceSet.blockNumber = blockNum;

  balanceSet.balanceChange = BigInt(balance1) + BigInt(balance2);
  balanceSet.timestamp = block.timestamp;

  await balanceSet.save();
  return [accountToSet];
};

//“AccountId” ’s free balance + “Balance”
export const handleDeposit = async (
  block: SubstrateBlock,
  substrateEvent: EventRecord
): Promise<string[]> => {
  const { event } = substrateEvent;
  const { timestamp: createdAt, block: rawBlock } = block;
  const { number: bn } = rawBlock.header;
  const [accountToSet, balance] = event.data.toJSON() as [string, bigint];
  let blockNum = bn.toBigInt();

  logger.info(`Deposit happened!: ${JSON.stringify(event)}`);

  // Create the new Deposit entity
  let aID = getID();
  const deposit = new Deposit(`${aID}`);
  deposit.accountId = accountToSet;
  deposit.blockNumber = blockNum;

  deposit.balanceChange = BigInt(balance);
  deposit.timestamp = block.timestamp;

  await deposit.save();
  return [accountToSet];
};

//“AccountId” ‘s free balance - “Balance”,“AccountId” ‘s reserve balance + “Balance”
export const handleReserved = async (
  block: SubstrateBlock,
  substrateEvent: EventRecord
): Promise<string[]> => {
  const { event } = substrateEvent;
  const { timestamp: createdAt, block: rawBlock } = block;
  const { number: bn } = rawBlock.header;
  const [accountToSet, balance] = event.data.toJSON() as [string, bigint];
  let blockNum = bn.toBigInt();

  logger.info(`Reserved happened!: ${JSON.stringify(event)}`);

  // Create the new Reserved entity
  let aID = getID();
  const reserved = new Reserved(`${aID}`);
  reserved.accountId = accountToSet;
  reserved.blockNumber = blockNum;
  reserved.balanceChange = BigInt(balance);
  reserved.timestamp = block.timestamp;

  await reserved.save();

  return [accountToSet];
};

//“AccountId” ‘s free balance + “Balance”, “AccountId” ‘s reserve balance - “Balance”
export const handleUnreserved = async (
  block: SubstrateBlock,
  substrateEvent: EventRecord
): Promise<string[]> => {
  const { event } = substrateEvent;
  const { timestamp: createdAt, block: rawBlock } = block;
  const { number: bn } = rawBlock.header;
  const [accountToSet, balance] = event.data.toJSON() as [string, bigint];
  let blockNum = bn.toBigInt();

  logger.info(`Unreserved happened!: ${JSON.stringify(event)}`);

  // Create the new Reserved entity
  let aID = getID();
  const unreserved = new Unreserved(`${aID}`);
  unreserved.accountId = accountToSet;
  unreserved.blockNumber = blockNum;
  unreserved.balanceChange = BigInt(balance);
  unreserved.timestamp = block.timestamp;

  await unreserved.save();

  return [accountToSet];
};

//“AccountId” ‘s free balance - “Balance”
export const handleWithdraw = async (
  block: SubstrateBlock,
  substrateEvent: EventRecord
): Promise<string[]> => {
  const { event } = substrateEvent;
  const { timestamp: createdAt, block: rawBlock } = block;
  const { number: bn } = rawBlock.header;
  const [accountToSet, balance] = event.data.toJSON() as [string, bigint];
  let blockNum = bn.toBigInt();

  logger.info(`Withdraw happened!: ${JSON.stringify(event)}`);

  // Create the new Withdraw entity
  let aID = getID();
  const withdraw = new Withdraw(`${aID}`);
  withdraw.accountId = accountToSet;
  withdraw.blockNumber = blockNum;
  withdraw.balanceChange = BigInt(balance);
  withdraw.timestamp = block.timestamp;

  await withdraw.save();

  return [accountToSet];
};

//“AccountId” ‘s total balance - “Balance”
//(hard to determine if the slash happens on free/reserve)
//If it is called through internal method “slash”, then it will prefer free balance first but potential slash reserve if free is not sufficient.
//If it is called through internal method “slash_reserved”, then it will slash reserve only.
export const handleSlash = async (
  block: SubstrateBlock,
  substrateEvent: EventRecord
): Promise<string[]> => {
  const { event } = substrateEvent;
  const { timestamp: createdAt, block: rawBlock } = block;
  const { number: bn } = rawBlock.header;
  const [accountToSet, balance] = event.data.toJSON() as [string, bigint];
  let blockNum = bn.toBigInt();

  logger.info(`Slash happened!: ${JSON.stringify(event)}`);

  // Create the new Withdraw entity
  let aID = getID();
  const slash = new Slash(`${aID}`);
  slash.accountId = accountToSet;
  slash.blockNumber = blockNum;
  slash.balanceChange = BigInt(balance);
  slash.timestamp = block.timestamp;

  await slash.save();

  return [accountToSet];
};

/* -ReserveRepatriated(AccountId, AccountId, Balance, Status) 
    AccountId: sender  
    AccountId: receiver
    Balance: amount of sender's reserve being transfered
    Status: Indicating the amount is added to receiver's reserve part or free part of balance.
    “AccountId1” ‘s reserve balance - “Balance”
    “AccountId2” ‘s “Status” balance + “Balance” (”Status” indicator of free/reserve part) */

export const handleReservRepatriated = async (
  block: SubstrateBlock,
  substrateEvent: EventRecord
): Promise<string[]> => {
  const { event } = substrateEvent;
  const { timestamp: createdAt, block: rawBlock } = block;
  const { number: bn } = rawBlock.header;
  const [sender, receiver, balance, status] = event.data.toJSON() as [
    string,
    string,
    bigint,
    string
  ];
  let blockNum = bn.toBigInt();

  logger.info(`Repatraiated happened!: ${JSON.stringify(event)}`);

  //ensure that our account entities exist

  // Create the new Reserved entity
  let aID = getID();
  const reservRepatriated = new ReservRepatriated(`${aID}`);

  reservRepatriated.fromAccountId = sender;
  reservRepatriated.toAccountId = receiver;
  reservRepatriated.blockNumber = blockNum;
  reservRepatriated.balanceChange = BigInt(balance);
  reservRepatriated.timestamp = block.timestamp;

  await reservRepatriated.save();

  return [sender, receiver];
};

import type { AlgodClient } from "../types.js";

/**
 * The zero address — an Algorand address representing all zero bytes.
 * Cannot send transactions or hold ALGOs.
 */
export const zeroAddress =
  "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAY5HFKQ";

/**
 * A well-known funded address used as the default sender for simulation.
 * Simulation does not require real signatures, so any valid address works,
 * but this one is known to have a nonzero balance on public networks.
 */
export const oneAddress =
  "G3MSA75OZEJTCCENOJDLDJK7UD7E2K5DNC7FVHCNOV7E3I4DTXTOWDUIFQ";

/**
 * Fetch account information from algod.
 */
export const getAccountInfo = async (
  algodClient: AlgodClient,
  addr: string,
) => await algodClient.accountInformation(addr).do();

import memoizeOne from 'memoize-one'
import npa from 'npm-package-arg'
import Npm from 'npm/lib/npm.js'
import { Arborist } from '@npmcli/arborist'
import { packument } from 'pacote'

export const getNpmConfig = memoizeOne(async function getNpmConfig() {
  const npm = new Npm()
  await npm.load()
  return npm.flatOptions
})


export async function fetchPackageManifest(packageName) {
  try {
    const npmConfig = await getNpmConfig()
    const packageSpec = npa(packageName)
    const manifest = await packument(packageSpec, { ...npmConfig, fullMetadata: true })
    return manifest
  } catch (e) {
    throw new Error(`can't fetch manifest for ${packageName}`, { cause: e })
  }
}

export async function loadActualArboristTree({ path = process.cwd() } = {}) {
  const npmConfig = await getNpmConfig()
  const arb = new Arborist({ ...npmConfig, path })

  /** @type {import('@npmcli/arborist').Node} */
  const tree = await arb.loadActual()
  return tree
}

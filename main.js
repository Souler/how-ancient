import { pickBy } from 'lodash'
import { DateTime, Duration } from 'luxon'
import { mean, median } from './lib/math.js'
import { fetchPackageManifest, loadActualArboristTree } from './lib/npm.js'
import 'error-cause/auto'

async function fetchPackagesAges(packages) {
  const agesEntries = await Promise.all(Object.entries(packages).flatMap(
    async ([packageName, version]) => {
      try {
        const packageManifest = await fetchPackageManifest(packageName)
        const releaseDate = packageManifest.time[version]
        const dt = DateTime.fromISO(releaseDate)
        const age = Math.abs(dt.diffNow('milliseconds').milliseconds)

        return [packageName, age]
      } catch (e) {
        console.error(`ignoring ${packageName} because we couldn't determine its age due to`, e)
        return [packageName, null]
      }
    },
  ))

  const ages = agesEntries.reduce((ages, [packageName, packageAge]) => {
    if (typeof packageAge === 'number') {
      ages[packageName] = packageAge
    }

    return ages
  }, {})

  return ages
}

async function main() {
  const tree = await loadActualArboristTree()
  const ages = await fetchPackagesAges(
    Object.fromEntries(
      Array.from(tree.children.entries(), ([packageName, node]) =>  [packageName, node.version])
    )
  )

  const isDirectDependency = packageName => tree.edgesOut.has(packageName)
  const isDirectDevDependency = packageName => isDirectDependency(packageName) && tree.edgesOut.get(packageName).type == 'dev'
  const isDirectProdDependency = packageName => isDirectDependency(packageName) && tree.edgesOut.get(packageName).type == 'prod'
  const formatAge = (age) => Duration.fromMillis(age).shiftTo('years', 'months', 'days').toHuman()
  const pickAges = (predicate) => Object.values(pickBy(ages, (_, packageName) => predicate(packageName)))

  console.log()
  console.log('dev dependencies median age:', formatAge(median(pickAges(isDirectDevDependency))))
  console.log('dev dependencies mean age:', formatAge(mean(pickAges(isDirectDevDependency))))

  console.log()
  console.log('prod dependencies median age:', formatAge(median(pickAges(isDirectProdDependency))))
  console.log('prod dependencies mean age:', formatAge(mean(pickAges(isDirectProdDependency))))

  console.log()
  console.log('direct dependencies median age:', formatAge(median(pickAges(isDirectDependency))))
  console.log('direct dependencies mean age:', formatAge(mean(pickAges(isDirectDependency))))

  console.log()
  console.log('all dependencies median age:', formatAge(median(Object.values(ages))))
  console.log('all dependencies mean age:', formatAge(mean(Object.values(ages))))
}

main().catch(console.log)
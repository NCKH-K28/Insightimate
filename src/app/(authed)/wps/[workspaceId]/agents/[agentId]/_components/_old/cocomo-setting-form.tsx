import { RatingLevelSelectors } from './rating-levels-selectors';
import React, { useMemo } from 'react';
import { COCOMOSettings, defaultCOCOMOSettings, RatingLevel } from './service';
import * as FRecord from 'fp-ts/Record';

const COCOMOOptionFullNames: Record<
  | keyof COCOMOSettings['scaleDrivers']
  | keyof COCOMOSettings['costDrivers']['product']
  | keyof COCOMOSettings['costDrivers']['personnel']
  | keyof COCOMOSettings['costDrivers']['platform'],
  string
> = {
  PREC: 'Precedentedness',
  FLEX: 'Development Flexibility',
  RESL: 'Architecture / Risk Resolution',
  TEAM: 'Team Cohesion',
  PMAT: 'Process Maturity',
  RELY: 'Required Software Reliability',
  DATA: 'Database Size',
  CPLX: 'Product Complexity',
  RUSE: 'Developed for Reusability',
  DOCU: 'Documentation Match to Life-Cycle Needs',
  ACAP: 'Analyst Capability',
  AEXP: 'Applications Experience',
  PCAP: 'Programmer Capability',
  VEXP: 'Virtual Machine Experience',
  LEXP: 'Language and Tool Experience',
  TIME: 'Execution Time Constraint',
  STOR: 'Main Storage Constraint',
  PVOL: 'Platform Volatility',
};

type COCOMOSettingsFormProps = {
  value?: COCOMOSettings;
  onChange?: (settings: COCOMOSettings) => void;
};
export const COCOMOSettingsForm = (props: COCOMOSettingsFormProps) => {
  const [settings, setSettings] = React.useState<COCOMOSettings>(() => {
    return props.value ?? defaultCOCOMOSettings;
  });

  const isControlled = useMemo(() => props.value !== undefined, [props.value]);

  const scaleDrivers = useMemo(() => settings.scaleDrivers, [settings.scaleDrivers]);
  const costDrivers = useMemo(() => settings.costDrivers, [settings.costDrivers]);

  const handleScaleDriverChange = (
    key: keyof COCOMOSettings['scaleDrivers'],
    value: RatingLevel,
  ) => {
    setSettings((prev) => ({
      ...prev,
      scaleDrivers: { ...prev.scaleDrivers, [key]: value },
    }));
  };

  const handleCostDriverChange = (
    category: keyof COCOMOSettings['costDrivers'],
    key:
      | keyof COCOMOSettings['costDrivers']['product']
      | keyof COCOMOSettings['costDrivers']['personnel']
      | keyof COCOMOSettings['costDrivers']['platform'],
    value: RatingLevel,
  ) => {
    setSettings((prev) => ({
      ...prev,
      costDrivers: {
        ...prev.costDrivers,
        [category]: { ...prev.costDrivers[category], [key]: value },
      },
    }));
  };

  const getCategoryKeys = (category: keyof COCOMOSettings['costDrivers']) => {
    return Object.keys(settings.costDrivers[category]) as Array<
      | keyof COCOMOSettings['costDrivers']['product']
      | keyof COCOMOSettings['costDrivers']['personnel']
      | keyof COCOMOSettings['costDrivers']['platform']
    >;
  };

  return (
    <div className='space-y-8'>
      <div style={{ maxWidth: 800 }}>
        <h2 className='text-lg font-medium'>Scale Drivers</h2>
        <div className='mt-4 space-y-4'>
          {FRecord.keys(scaleDrivers).map((key) => (
            <div key={key} className='flex items-center justify-between'>
              <label className='font-medium'>{COCOMOOptionFullNames[key]}</label>
              <RatingLevelSelectors
                value={scaleDrivers[key]}
                onChange={(value) => handleScaleDriverChange(key, value)}
              />
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className='text-lg font-medium'>Cost Drivers</h2>

        <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 mt-4'>
          {FRecord.keys(costDrivers).map((category) => (
            <div key={category}>
              <h3 className='text-md font-semibold capitalize'>{category}</h3>
              <div className='mt-4 space-y-4'>
                {getCategoryKeys(category).map((key) => (
                  <div key={key} className='flex items-center justify-between'>
                    <label className='font-medium'>{COCOMOOptionFullNames[key]}</label>
                    <RatingLevelSelectors
                      value={
                        costDrivers[category][key as keyof (typeof costDrivers)[typeof category]]
                      }
                      onChange={(value) => handleCostDriverChange(category, key, value)}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

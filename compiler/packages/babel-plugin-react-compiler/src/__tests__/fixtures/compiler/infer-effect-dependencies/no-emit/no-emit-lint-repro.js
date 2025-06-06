// @inferEffectDependencies @noEmit
import {print} from 'shared-runtime';
import useEffectWrapper from 'useEffectWrapper';

function ReactiveVariable({propVal}) {
  const arr = [propVal];
  useEffectWrapper(() => print(arr));
}

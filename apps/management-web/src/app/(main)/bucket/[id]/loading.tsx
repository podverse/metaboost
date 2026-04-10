import { LoadingSpinner } from '@boilerplate/ui';

import styles from './loading.module.scss';

export default function BucketDetailLoading() {
  return (
    <div className={styles.wrapper}>
      <LoadingSpinner size="lg" />
    </div>
  );
}
